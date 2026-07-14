import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "SignSeal Admin";
  if (!email || !password) {
    throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD to create an admin user.");
  }
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  }
  await prisma.user.upsert({
    where: { email },
    update: { name, role: Role.ADMIN, active: true, passwordHash: await bcrypt.hash(password, 12) },
    create: { email, name, role: Role.ADMIN, passwordHash: await bcrypt.hash(password, 12) }
  });
  console.log(`Admin user ready: ${email}`);
}

main().finally(async () => prisma.$disconnect()).catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
