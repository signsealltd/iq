import { PrismaClient, Role } from "@prisma/client";
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
