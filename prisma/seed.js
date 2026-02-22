/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const { PrismaClient } = require('@prisma/client');
const bcrypt = require("bcryptjs");

const adapter = new PrismaBetterSqlite3({ url: "file:/Users/papernpencil/Desktop/SSF Pulikkal Division/New Portal/portal/prisma/dev.db" });
const prisma = new PrismaClient({ adapter });

async function main() {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.admin.upsert({
        where: { username: "admin" },
        update: {},
        create: { username: "admin", password: hashedPassword },
    });

    const settings = [
        { key: "registration_status", value: "open" },
        { key: "page_heading", value: "Smart Registration & Admission Portal" },
        { key: "page_subheading", value: "SSF Pulikkal Division" },
        { key: "page_instructions", value: "Please fill in your details carefully. Your mobile number will be used for identification. Each mobile number can only be registered once." },
        { key: "page_logo", value: "" },
        { key: "show_designation", value: "true" },
        { key: "show_sector", value: "true" },
        { key: "show_unit", value: "true" },
    ];

    for (const s of settings) {
        await prisma.setting.upsert({
            where: { key: s.key },
            update: {},
            create: s,
        });
    }

    const sectors = [
        { name: "North Sector", units: ["Unit 1", "Unit 2", "Unit 3"] },
        { name: "South Sector", units: ["Unit 1", "Unit 2"] },
        { name: "East Sector", units: ["Unit 1", "Unit 2", "Unit 3", "Unit 4"] },
        { name: "West Sector", units: ["Unit 1", "Unit 2", "Unit 3"] },
    ];

    for (const s of sectors) {
        const slug = s.name.toLowerCase().replace(/\s+/g, "-");
        const sector = await prisma.sector.upsert({
            where: { name: s.name },
            update: {},
            create: { name: s.name, slug },
        });
        for (const unitName of s.units) {
            await prisma.unit.upsert({
                where: { name_sectorId: { name: unitName, sectorId: sector.id } },
                update: {},
                create: { name: unitName, sectorId: sector.id },
            });
        }
        // Create sector admin
        const sectorPass = await bcrypt.hash(`sector${sector.id}123`, 10);
        await prisma.sectorAdmin.upsert({
            where: { sectorId: sector.id },
            update: {},
            create: {
                username: `sector${sector.id}`,
                password: sectorPass,
                sectorId: sector.id,
            },
        });
    }

    console.log("✅ Seeding complete!");
    console.log("Admin login: admin / admin123");
    console.log("Sector logins: sector1/sector1123, sector2/sector2123, ...");
}

main().catch(console.error).finally(() => prisma.$disconnect());
