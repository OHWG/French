import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.ADMIN_PASSWORD ?? "changeme123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const hashed = await bcrypt.hash(password, 12);
  await prisma.user.create({
    data: { name: "Admin", email, password: hashed, role: "admin" },
  });
  console.log(`Created admin user: ${email}`);
  console.log(`Password: ${password} (change this immediately!)`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
