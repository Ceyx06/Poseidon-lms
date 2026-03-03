import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Adding coordinator user...");

  const hashedPassword = await bcrypt.hash("coord123", 12);

  await prisma.user.upsert({
    where: { email: "coordinator@maritime.ph" },
    update: { password: hashedPassword },
    create: {
      name: "Crew Coordinator",
      email: "coordinator@maritime.ph",
      password: hashedPassword,
      role: "COORDINATOR",
    },
  });

  console.log("✅ Coordinator user created!");
  console.log("   Email: coordinator@maritime.ph");
  console.log("   Password: coord123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
