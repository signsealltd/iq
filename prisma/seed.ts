import { EmailTemplateEvent, PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const labourRates = [
  ["Design", 28, 65],
  ["Artwork setup", 24, 55],
  ["Print production", 22, 58],
  ["Vinyl preparation", 22, 55],
  ["Sign manufacture", 26, 68],
  ["Installation", 30, 75],
  ["Senior installation", 38, 92],
  ["Electrical work", 42, 105],
  ["Welding and fabrication", 36, 88],
  ["CNC routing", 32, 82],
  ["Laser cutting", 32, 82],
  ["Travel", 18, 45],
  ["Survey", 30, 75],
  ["Project management", 35, 85]
] as const;

const rules = [
  ["minimum_material_markup", "Minimum material markup", 0.45, "percent", "Minimum uplift applied to material and consumable costs."],
  ["minimum_labour_charge", "Minimum labour charge", 55, "gbp", "Minimum customer-facing labour charge."],
  ["minimum_installation_charge", "Minimum installation charge", 150, "gbp", "Minimum charge for any installed job."],
  ["minimum_job_value", "Minimum job value", 95, "gbp", "Minimum invoice value before VAT."],
  ["target_gross_margin", "Target gross margin", 0.55, "percent", "Commercial target margin for recommendations."],
  ["minimum_gross_margin", "Minimum gross margin", 0.35, "percent", "Floor used for minimum viable price."],
  ["rush_job_percentage", "Rush-job percentage", 0.15, "percent", "Applied to urgent jobs."],
  ["weekend_premium", "Weekend premium", 0.25, "percent", "Applied where weekend work is selected."],
  ["difficult_access_premium", "Difficult-access premium", 0.12, "percent", "Allowance for risky or complex access."],
  ["repeat_customer_discount", "Repeat-customer discount", 0.05, "percent", "Optional discount for returning customers."],
  ["trade_discount", "Trade discount", 0.10, "percent", "Optional trade customer discount."],
  ["design_fee_waiver", "Design fee waiver", 0, "gbp", "Configurable waiver value."],
  ["outsourced_work_markup", "Outsourced-work markup", 0.30, "percent", "Markup applied to outsourced manufacturing."],
  ["wastage_allowance", "Wastage allowance", 0.08, "percent", "Default wastage allowance."],
  ["risk_allowance", "Risk allowance", 0.05, "percent", "Default risk allowance."]
] as const;


const portalStages = [
  "Initial enquiry",
  "Site survey",
  "Quotation",
  "Artwork",
  "Client approval",
  "Production",
  "Installation scheduled",
  "Installed",
  "Complete"
];

const emailTemplates: [EmailTemplateEvent, string, string][] = [
  ["CLIENT_INVITATION", "Your SignSeal project portal invitation", "Hello {{name}}, you have been invited to the SignSeal project portal for {{client}}."],
  ["CLIENT_VISIBLE_MESSAGE", "New SignSeal project update", "A new update has been posted on {{project}}."],
  ["NEW_ARTWORK_PROOF", "New artwork proof ready", "A new artwork proof is ready for review on {{project}}."],
  ["APPROVAL_REQUESTED", "Artwork approval requested", "Please review and approve the artwork proof for {{project}}."],
  ["AMENDMENT_REQUESTED", "Artwork amendments requested", "Artwork amendments have been requested for {{project}}."],
  ["DOCUMENT_UPLOADED", "New project document uploaded", "A new document has been uploaded to {{project}}."],
  ["INSTALLATION_DATE_CONFIRMED", "Installation date confirmed", "An installation date has been confirmed for {{project}}."],
  ["CLIENT_ACTION_REQUEST_ASSIGNED", "Action required for your SignSeal project", "A client action request has been assigned for {{project}}."]
];
const matrix = [
  ["Vehicle Wraps", "Printed LWB van infill wrap", "vehicle", 950, 1450, 1950, 360, 12, 0.35, 0.55],
  ["Cut Vinyl Lettering", "SWB van lettering", "vehicle", 220, 385, 520, 55, 3.5, 0.35, 0.55],
  ["Vehicle Graphics", "Pair of van sides", "pair", 180, 320, 440, 45, 2.5, 0.35, 0.55],
  ["Vehicle Graphics", "Rear-door graphics", "set", 95, 185, 260, 28, 1.5, 0.35, 0.55],
  ["Vehicle Graphics", "Bonnet graphics", "item", 85, 150, 230, 24, 1.2, 0.35, 0.55],
  ["ACM Signs", "ACM panel per square metre", "sqm", 95, 145, 210, 42, 1.2, 0.35, 0.55],
  ["Banners", "Banner per square metre", "sqm", 38, 58, 85, 14, 0.4, 0.35, 0.55],
  ["Health and Safety Signs", "Site board", "item", 45, 85, 130, 18, 0.6, 0.35, 0.55],
  ["Tray Signs", "Shop fascia", "metre", 260, 420, 650, 135, 2.5, 0.35, 0.55],
  ["Design Only", "Design-only hourly rate", "hour", 55, 75, 95, 0, 1, 0.35, 0.55],
  ["Installation Only", "Installation half-day", "half-day", 240, 340, 450, 0, 4, 0.35, 0.55],
  ["Installation Only", "Installation full-day", "day", 420, 620, 820, 0, 8, 0.35, 0.55]
] as const;

async function main() {
  for (const [name, internalCostRate, customerChargeRate] of labourRates) {
    await prisma.labourRate.upsert({
      where: { name },
      update: { internalCostRate, customerChargeRate },
      create: { name, internalCostRate, customerChargeRate }
    });
  }

  for (const [key, label, value, unit, description] of rules) {
    await prisma.pricingRule.upsert({
      where: { key },
      update: { label, value, unit, description },
      create: { key, label, value, unit, description }
    });
  }

  for (const entry of matrix) {
    const [jobCategory, jobSubtype, unit, minimumPrice, targetPrice, premiumPrice, typicalMaterialCost, typicalLabourHours, minimumMargin, targetMargin] = entry;
    const existing = await prisma.pricingMatrixEntry.findFirst({ where: { jobCategory, jobSubtype } });
    const data = { jobCategory, jobSubtype, unit, minimumPrice, targetPrice, premiumPrice, typicalMaterialCost, typicalLabourHours, minimumMargin, targetMargin, notes: "Editable seeded example." };
    if (existing) await prisma.pricingMatrixEntry.update({ where: { id: existing.id }, data });
    else await prisma.pricingMatrixEntry.create({ data });
  }

  await prisma.customer.upsert({
    where: { id: "seed-customer-signseal-demo" },
    update: {},
    create: {
      id: "seed-customer-signseal-demo",
      company: "Example Fleet Customer",
      contactName: "Alex Buyer",
      email: "alex@example.invalid",
      phone: "01234 567890",
      customerType: "FLEET",
      pricingNotes: "Seed customer for local demonstrations."
    }
  });

  for (const [event, subject, body] of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { event },
      update: { subject, body, active: true },
      create: { event, subject, body, active: true }
    });
  }

  const heartsClient = await prisma.customer.upsert({
    where: { id: "seed-client-hearts-academy-trust" },
    update: { portalEnabled: true },
    create: {
      id: "seed-client-hearts-academy-trust",
      company: "HEARTS Academy Trust",
      contactName: "Trust Estates Team",
      email: "estates@example.invalid",
      phone: "01268 000000",
      billingAddress: "HEARTS Academy Trust\nEssex",
      customerType: "PUBLIC_SECTOR",
      notes: "Optional demo client for the client project portal.",
      portalEnabled: true
    }
  });

  const heartsProgramme = await prisma.clientProgramme.upsert({
    where: { id: "seed-programme-hearts-2026" },
    update: { customerId: heartsClient.id, status: "ACTIVE" },
    create: {
      id: "seed-programme-hearts-2026",
      customerId: heartsClient.id,
      name: "HEARTS School Signage Project 2026",
      summary: "Multi-site school signage programme covering surveys, artwork, manufacture and installation across the trust estate.",
      status: "ACTIVE",
      targetCompletionDate: new Date("2026-08-31T00:00:00.000Z")
    }
  });

  const heartsProjects = [
    "Briscoe Primary School & Nursery",
    "Hilltop Infant and Junior School",
    "Stambridge Primary School",
    "Waterman Primary School",
    "Wickford Church of England School",
    "HEARTS Head Office / Atrium"
  ];

  for (const [index, name] of heartsProjects.entries()) {
    const project = await prisma.clientProject.upsert({
      where: { id: `seed-project-hearts-${index + 1}` },
      update: { programmeId: heartsProgramme.id, status: index < 2 ? "ARTWORK" : "SITE_SURVEY" },
      create: {
        id: `seed-project-hearts-${index + 1}`,
        programmeId: heartsProgramme.id,
        name,
        status: index < 2 ? "ARTWORK" : "SITE_SURVEY",
        siteAddress: `${name}\nEssex`,
        siteContactName: "School Office",
        description: "Demo portal project for tracking surveys, proofs, action requests and installation progress.",
        surveyDate: new Date(`2026-0${Math.min(index + 2, 7)}-12T09:00:00.000Z`),
        targetDate: new Date(`2026-0${Math.min(index + 3, 8)}-20T09:00:00.000Z`),
        quoteStatus: index < 3 ? "ACCEPTED" : "DRAFT",
        artworkStatus: index < 2 ? "PROOF_SENT" : "NOT_STARTED",
        productionStatus: "NOT_STARTED",
        installationStatus: "NOT_SCHEDULED",
        notes: "Client-visible demo project notes.",
        internalNotes: "Internal-only demo notes; must not display to client users."
      }
    });

    for (const [stageIndex, label] of portalStages.entries()) {
      await prisma.projectStage.upsert({
        where: { projectId_sortOrder: { projectId: project.id, sortOrder: stageIndex + 1 } },
        update: { label, enabled: true, completedAt: stageIndex <= Math.min(index + 1, 4) ? new Date() : null },
        create: { projectId: project.id, label, sortOrder: stageIndex + 1, enabled: true, completedAt: stageIndex <= Math.min(index + 1, 4) ? new Date() : null }
      });
    }

    await prisma.portalProjectMessage.deleteMany({ where: { projectId: project.id, senderName: "SignSeal Projects" } });
    await prisma.clientActionRequest.deleteMany({ where: { projectId: project.id, title: "Confirm site access" } });
    await prisma.portalDocument.deleteMany({ where: { projectId: project.id, storageKey: `demo/hearts/${index + 1}/proof-v1.pdf` } });
    await prisma.portalProjectMessage.create({ data: { projectId: project.id, senderName: "SignSeal Projects", body: `Initial portal record created for ${name}.`, visibility: "CLIENT_VISIBLE" } });
    await prisma.clientActionRequest.create({ data: { projectId: project.id, title: "Confirm site access", description: "Please confirm visitor access requirements and any restricted installation windows.", dueDate: new Date("2026-03-01T00:00:00.000Z"), status: "OPEN" } });
    await prisma.portalDocument.create({ data: { projectId: project.id, filename: `${name} artwork proof v1.pdf`, contentType: "application/pdf", sizeBytes: 1024, storageKey: `demo/hearts/${index + 1}/proof-v1.pdf`, type: "ARTWORK_PROOF", visibility: "CLIENT_VISIBLE", version: 1, description: "Demo artwork proof metadata only." } });
  }

  await prisma.clientInvitation.upsert({
    where: { tokenHash: "seed-demo-hearts-invitation-token-hash" },
    update: { status: "PENDING", expiresAt: new Date("2026-12-31T23:59:59.000Z") },
    create: { customerId: heartsClient.id, email: "client-contact@example.invalid", name: "HEARTS Client Contact", tokenHash: "seed-demo-hearts-invitation-token-hash", expiresAt: new Date("2026-12-31T23:59:59.000Z") }
  });

  if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
    await prisma.user.upsert({
      where: { email: process.env.SEED_ADMIN_EMAIL },
      update: { role: Role.ADMIN, active: true },
      create: {
        email: process.env.SEED_ADMIN_EMAIL,
        name: "SignSeal Admin",
        role: Role.ADMIN,
        passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12)
      }
    });
  }
}

main()
  .finally(async () => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });



