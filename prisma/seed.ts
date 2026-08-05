import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const employeeNames = [
  "Dan Palma",
  "Keeby Binas",
  "Verly Reyes",
  "Aubrey Tutor",
  "Joaquin Tuason",
];

async function main() {
  for (const name of employeeNames) {
    const existing = await prisma.employee.findFirst({ where: { name } });
    if (!existing) {
      await prisma.employee.create({ data: { name } });
    }
  }
  console.log(`Seeded ${employeeNames.length} employees (no PIN set yet).`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
