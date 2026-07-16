import "server-only";

import * as XLSX from "xlsx";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type CustomerImportRow = {
  rowNumber: number;
  company: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  shippingAddress: string | null;
  action: "create" | "update" | "skip";
  matchReason: string | null;
  existingCustomerId: string | null;
  warnings: string[];
};

export type CustomerImportResult = {
  rows: CustomerImportRow[];
  summary: { total: number; create: number; update: number; skip: number };
};

type ExistingCustomer = {
  id: string;
  company: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  billingAddress: string | null;
  notes: string | null;
};

export async function previewCustomerImport(file: File): Promise<CustomerImportResult> {
  const rows = await parseCustomerRows(file);
  return matchRows(rows);
}

export async function importCustomers(file: File) {
  const preview = await previewCustomerImport(file);
  let created = 0;
  let updated = 0;
  const createdIds: string[] = [];
  const updatedIds: string[] = [];

  for (const row of preview.rows) {
    if (row.action === "skip") continue;
    if (row.action === "update" && row.existingCustomerId) {
      const existing = await prisma.customer.findUnique({ where: { id: row.existingCustomerId } });
      if (!existing) continue;
      await prisma.customer.update({
        where: { id: existing.id },
        data: mergeCustomerData(existing, row)
      });
      updated += 1;
      updatedIds.push(existing.id);
      continue;
    }
    const customer = await prisma.customer.create({ data: newCustomerData(row) });
    created += 1;
    createdIds.push(customer.id);
  }

  return {
    ...preview,
    imported: { created, updated, skipped: preview.summary.skip, createdIds, updatedIds }
  };
}

async function parseCustomerRows(file: File) {
  const buffer = Buffer.from(await file.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) throw new Error("The workbook does not contain any sheets.");

  const rawRows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: "", blankrows: false });
  const headerIndex = rawRows.findIndex((row) => row.some((cell) => normaliseHeader(cell) === "customer"));
  if (headerIndex < 0) throw new Error("Could not find a QuickBooks customer header row.");

  const headers = rawRows[headerIndex].map((cell) => normaliseHeader(cell));
  const index = {
    customer: headers.findIndex((header) => header === "customer" || header === "name" || header === "displayname"),
    phone: headers.findIndex((header) => header.includes("phone")),
    email: headers.findIndex((header) => header.includes("email")),
    fullName: headers.findIndex((header) => header === "fullname" || header === "contact" || header === "contactname"),
    billingAddress: headers.findIndex((header) => header.includes("billingaddress") || header === "billing"),
    shippingAddress: headers.findIndex((header) => header.includes("shippingaddress") || header === "shipping")
  };

  return rawRows.slice(headerIndex + 1).map((row, offset) => {
    const company = cleanCell(row[index.customer]);
    const billingAddress = cleanAddress(row[index.billingAddress]);
    const shippingAddress = cleanAddress(row[index.shippingAddress]);
    return {
      rowNumber: headerIndex + offset + 2,
      company,
      contactName: cleanCell(row[index.fullName]) || null,
      email: cleanEmail(row[index.email]),
      phone: cleanPhone(row[index.phone]),
      billingAddress: billingAddress || null,
      shippingAddress: shippingAddress || null
    };
  });
}

async function matchRows(rows: Awaited<ReturnType<typeof parseCustomerRows>>): Promise<CustomerImportResult> {
  const existing = await prisma.customer.findMany({
    select: { id: true, company: true, contactName: true, email: true, phone: true, billingAddress: true, notes: true }
  });
  const byEmail = new Map(existing.filter((customer) => customer.email).map((customer) => [normaliseEmail(customer.email), customer]));
  const byCompany = new Map(existing.map((customer) => [normaliseName(customer.company), customer]));
  const seen = new Set<string>();

  const mapped = rows.map<CustomerImportRow>((row) => {
    const warnings: string[] = [];
    if (!row.company) warnings.push("Missing customer name");
    if (!row.email) warnings.push("Missing email");
    const duplicateKey = `${normaliseName(row.company)}|${normaliseEmail(row.email)}`;
    if (seen.has(duplicateKey)) warnings.push("Duplicate row in this upload");
    seen.add(duplicateKey);

    const emailMatch = row.email ? byEmail.get(normaliseEmail(row.email)) : null;
    const companyMatch = row.company ? byCompany.get(normaliseName(row.company)) : null;
    const match = emailMatch ?? companyMatch ?? null;
    const matchReason = emailMatch ? "Matched existing customer by email" : companyMatch ? "Matched existing customer by company" : null;
    const action = !row.company || seenDuplicateOnly(warnings) ? "skip" : match ? "update" : "create";

    return {
      ...row,
      action,
      matchReason,
      existingCustomerId: match?.id ?? null,
      warnings
    };
  });

  return { rows: mapped, summary: summarise(mapped) };
}

function newCustomerData(row: CustomerImportRow): Prisma.CustomerUncheckedCreateInput {
  return {
    company: row.company,
    contactName: row.contactName,
    email: row.email?.toLowerCase() ?? null,
    phone: row.phone,
    billingAddress: row.billingAddress,
    customerType: "COMMERCIAL",
    notes: importNotes(row)
  };
}

function mergeCustomerData(existing: ExistingCustomer, row: CustomerImportRow): Prisma.CustomerUncheckedUpdateInput {
  return {
    contactName: existing.contactName || row.contactName,
    email: existing.email || row.email?.toLowerCase() || null,
    phone: existing.phone || row.phone,
    billingAddress: existing.billingAddress || row.billingAddress,
    notes: mergeNotes(existing.notes, importNotes(row))
  };
}

function importNotes(row: CustomerImportRow) {
  const notes = ["Imported from QuickBooks customer export."];
  if (row.shippingAddress && row.shippingAddress !== row.billingAddress) notes.push(`Shipping address:\n${row.shippingAddress}`);
  return notes.join("\n\n");
}

function mergeNotes(existing: string | null, imported: string) {
  if (!existing) return imported;
  if (existing.includes("Imported from QuickBooks customer export.")) return existing;
  return `${existing}\n\n${imported}`;
}

function summarise(rows: CustomerImportRow[]) {
  return {
    total: rows.length,
    create: rows.filter((row) => row.action === "create").length,
    update: rows.filter((row) => row.action === "update").length,
    skip: rows.filter((row) => row.action === "skip").length
  };
}

function seenDuplicateOnly(warnings: string[]) {
  return warnings.includes("Missing customer name") || warnings.includes("Duplicate row in this upload");
}

function cleanCell(value: unknown) {
  return String(value ?? "").replace(/\r\n/g, "\n").trim();
}

function cleanAddress(value: unknown) {
  const address = cleanCell(value);
  return address && !/^n\/?a$/i.test(address) ? address : "";
}

function cleanEmail(value: unknown) {
  const email = cleanCell(value).split(/\s+/).find((part) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(part));
  return email?.toLowerCase() ?? null;
}

function cleanPhone(value: unknown) {
  const phone = cleanCell(value).replace(/^Phone:\s*/gim, "").replace(/^Mobile:\s*/gim, "").trim();
  return phone || null;
}

function normaliseHeader(value: unknown) {
  return cleanCell(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normaliseName(value: unknown) {
  return cleanCell(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function normaliseEmail(value: unknown) {
  return cleanCell(value).toLowerCase();
}
