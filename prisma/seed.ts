// prisma/seed.ts
import { PrismaClient, Role, VesselStatus, DocStatus, InspectionResult } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const prisma = new PrismaClient();

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ────────────────────────────────────────────────────────────────
  const adminPass = await bcrypt.hash("admin123", 12);
  const staffPass = await bcrypt.hash("staff123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@maritime.ph" },
    update: {},
    create: { name: "Admin User", email: "admin@maritime.ph", password: adminPass, role: Role.ADMIN },
  });

  const manager = await prisma.user.upsert({
    where: { email: "manager@maritime.ph" },
    update: {},
    create: { name: "Port Manager", email: "manager@maritime.ph", password: staffPass, role: Role.MANAGER },
  });

  await prisma.user.upsert({
    where: { email: "staff@maritime.ph" },
    update: {},
    create: { name: "Staff Member", email: "staff@maritime.ph", password: staffPass, role: Role.STAFF },
  });

  // ── Vessels ──────────────────────────────────────────────────────────────
  const vessel1 = await prisma.vessel.upsert({
    where: { imoNumber: "IMO9234567" },
    update: {},
    create: {
      name: "MV Oceanus",
      imoNumber: "IMO9234567",
      flag: "Philippines",
      vesselType: "Bulk Carrier",
      grossTonnage: 45000,
      owner: "Oceanus Shipping Corp.",
      operator: "Philippine Carriers Inc.",
      status: VesselStatus.ACTIVE,
    },
  });

  const vessel2 = await prisma.vessel.upsert({
    where: { imoNumber: "IMO9345678" },
    update: {},
    create: {
      name: "MV Pacific Star",
      imoNumber: "IMO9345678",
      flag: "Philippines",
      vesselType: "Container Ship",
      grossTonnage: 28000,
      owner: "Pacific Star Lines",
      operator: "Pacific Star Lines",
      status: VesselStatus.ACTIVE,
    },
  });

  const vessel3 = await prisma.vessel.upsert({
    where: { imoNumber: "IMO9456789" },
    update: {},
    create: {
      name: "MV Horizon",
      imoNumber: "IMO9456789",
      flag: "Philippines",
      vesselType: "Tanker",
      grossTonnage: 62000,
      owner: "Horizon Petroleum Transport",
      operator: "Horizon Petroleum Transport",
      status: VesselStatus.ACTIVE,
    },
  });

  // ── Crew Members ─────────────────────────────────────────────────────────
  const crew1 = await prisma.crewMember.upsert({
    where: { seafarerIdNo: "SID-001-PH" },
    update: {},
    create: {
      firstName: "Juan",
      lastName: "Dela Cruz",
      rank: "Master",
      nationality: "Filipino",
      dateOfBirth: new Date("1978-04-15"),
      seafarerIdNo: "SID-001-PH",
      email: "jdelacruz@maritime.ph",
    },
  });

  const crew2 = await prisma.crewMember.upsert({
    where: { seafarerIdNo: "SID-002-PH" },
    update: {},
    create: {
      firstName: "Maria",
      lastName: "Santos",
      rank: "Chief Officer",
      nationality: "Filipino",
      dateOfBirth: new Date("1985-08-22"),
      seafarerIdNo: "SID-002-PH",
      email: "msantos@maritime.ph",
    },
  });

  const crew3 = await prisma.crewMember.upsert({
    where: { seafarerIdNo: "SID-003-PH" },
    update: {},
    create: {
      firstName: "Pedro",
      lastName: "Reyes",
      rank: "Chief Engineer",
      nationality: "Filipino",
      dateOfBirth: new Date("1980-12-05"),
      seafarerIdNo: "SID-003-PH",
    },
  });

  // ── Vessel Certificates ──────────────────────────────────────────────────
  await prisma.vesselCertificate.createMany({
    skipDuplicates: true,
    data: [
      {
        vesselId: vessel1.id, certificateType: "Safety Management Certificate",
        certificateNo: "SMC-2024-001", issuedBy: "MARINA",
        issueDate: daysFromNow(-360), expiryDate: daysFromNow(5), status: DocStatus.EXPIRING_SOON,
      },
      {
        vesselId: vessel1.id, certificateType: "International Tonnage Certificate",
        certificateNo: "ITC-2024-002", issuedBy: "DNV GL",
        issueDate: daysFromNow(-300), expiryDate: daysFromNow(85), status: DocStatus.VALID,
      },
      {
        vesselId: vessel1.id, certificateType: "Load Line Certificate",
        certificateNo: "LLC-2024-003", issuedBy: "Lloyd's Register",
        issueDate: daysFromNow(-347), expiryDate: daysFromNow(18), status: DocStatus.EXPIRING_SOON,
      },
      {
        vesselId: vessel2.id, certificateType: "Safety Construction Certificate",
        certificateNo: "SCC-2024-004", issuedBy: "BV Marine",
        issueDate: daysFromNow(-400), expiryDate: daysFromNow(-10), status: DocStatus.EXPIRED,
      },
      {
        vesselId: vessel3.id, certificateType: "International Oil Pollution Prevention",
        certificateNo: "IOPP-2024-005", issuedBy: "MARINA",
        issueDate: daysFromNow(-100), expiryDate: daysFromNow(200), status: DocStatus.VALID,
      },
    ],
  });

  // ── Crew Documents ────────────────────────────────────────────────────────
  await prisma.crewDocument.createMany({
    skipDuplicates: true,
    data: [
      {
        crewMemberId: crew1.id, documentType: "STCW Basic Safety Training",
        documentNo: "STCW-001", issuedBy: "MAAP",
        issueDate: daysFromNow(-365), expiryDate: daysFromNow(25), status: DocStatus.EXPIRING_SOON,
      },
      {
        crewMemberId: crew1.id, documentType: "Medical Fitness Certificate",
        documentNo: "MED-001", issuedBy: "Maritime Medical Center",
        issueDate: daysFromNow(-300), expiryDate: daysFromNow(65), status: DocStatus.VALID,
      },
      {
        crewMemberId: crew2.id, documentType: "Officer of the Watch License",
        documentNo: "OOW-002", issuedBy: "MARINA",
        issueDate: daysFromNow(-730), expiryDate: daysFromNow(-5), status: DocStatus.EXPIRED,
      },
      {
        crewMemberId: crew2.id, documentType: "Proficiency in Survival Craft",
        documentNo: "PSC-002", issuedBy: "MAAP",
        issueDate: daysFromNow(-500), expiryDate: daysFromNow(150), status: DocStatus.VALID,
      },
      {
        crewMemberId: crew3.id, documentType: "Engineer Officer License",
        documentNo: "EOL-003", issuedBy: "MARINA",
        issueDate: daysFromNow(-200), expiryDate: daysFromNow(50), status: DocStatus.EXPIRING_SOON,
      },
    ],
  });

  // ── Port Permits ──────────────────────────────────────────────────────────
  await prisma.portPermit.createMany({
    skipDuplicates: true,
    data: [
      {
        vesselId: vessel1.id, permitType: "Port Entry Permit",
        permitNo: "PEP-2024-001", portName: "Port of Manila", portCountry: "Philippines",
        issuedBy: "Philippine Ports Authority", issueDate: daysFromNow(-60), expiryDate: daysFromNow(12),
        status: DocStatus.EXPIRING_SOON,
      },
      {
        vesselId: vessel2.id, permitType: "Port State Control Clearance",
        permitNo: "PSC-2024-002", portName: "Port of Cebu", portCountry: "Philippines",
        issuedBy: "Philippine Coast Guard", issueDate: daysFromNow(-200), expiryDate: daysFromNow(-2),
        status: DocStatus.EXPIRED,
      },
      {
        vesselId: vessel3.id, permitType: "Dangerous Goods Declaration",
        permitNo: "DGD-2024-003", portName: "Port of Batangas", portCountry: "Philippines",
        issuedBy: "Philippine Ports Authority", issueDate: daysFromNow(-30), expiryDate: daysFromNow(55),
        status: DocStatus.VALID,
      },
    ],
  });

  // ── Ship Inspections ──────────────────────────────────────────────────────
  await prisma.shipInspection.createMany({
    skipDuplicates: true,
    data: [
      {
        vesselId: vessel1.id, inspectionType: "Annual Safety Inspection",
        inspectionNo: "INS-2024-001", inspector: "MARINA",
        inspectionDate: daysFromNow(-340), nextDueDate: daysFromNow(25),
        result: InspectionResult.PASSED, status: DocStatus.EXPIRING_SOON,
      },
      {
        vesselId: vessel2.id, inspectionType: "Hull & Machinery Survey",
        inspectionNo: "INS-2024-002", inspector: "DNV GL",
        inspectionDate: daysFromNow(-400), nextDueDate: daysFromNow(-5),
        result: InspectionResult.PASSED, status: DocStatus.EXPIRED,
      },
      {
        vesselId: vessel3.id, inspectionType: "Fire Safety Equipment Inspection",
        inspectionNo: "INS-2024-003", inspector: "BV Marine",
        inspectionDate: daysFromNow(-50), nextDueDate: daysFromNow(90),
        result: InspectionResult.PASSED_WITH_REMARKS, status: DocStatus.VALID,
      },
      {
        vesselId: vessel1.id, inspectionType: "MARPOL Compliance Inspection",
        inspectionNo: "INS-2024-004", inspector: "Philippine Coast Guard",
        inspectionDate: daysFromNow(-100), nextDueDate: daysFromNow(200),
        result: InspectionResult.PASSED, status: DocStatus.VALID,
      },
    ],
  });

  console.log("✅ Seed complete!");
  console.log("📧 Login credentials:");
  console.log("   Admin:   admin@maritime.ph / admin123");
  console.log("   Manager: manager@maritime.ph / staff123");
  console.log("   Staff:   staff@maritime.ph / staff123");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
