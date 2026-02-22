import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";

// Manually load env for seed script
const connectionString = process.env.DATABASE_URL || "postgresql://postgres:8LCF3VQ6JoRxENzK@db.jtrfpnxphidisuyvsjab.supabase.co:5432/postgres";
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    // Seed admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await prisma.admin.upsert({
        where: { username: "admin" },
        update: {},
        create: { username: "admin", password: hashedPassword },
    });

    // Seed default settings
    const settings = [
        { key: "registration_status", value: "open" },
        { key: "page_heading", value: "Smart Registration & Admission Portal" },
        { key: "page_instructions", value: "Please fill in your details to register. Ensure your mobile number is correct as it will be used for identification." },
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

    // Seed sample sectors and units
    const sectors = [
        { name: "Sector Alpha", units: ["Unit 1", "Unit 2", "Unit 3"] },
        { name: "Sector Beta", units: ["Unit 1", "Unit 2"] },
        { name: "Sector Gamma", units: ["Unit 1", "Unit 2", "Unit 3", "Unit 4"] },
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
    }

    // Seed Hero
    await prisma.hero.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            bannerImage: "https://images.unsplash.com/photo-1542810634-71277d95dcbb?q=80&w=2070&auto=format&fit=crop",
            title: "SSF Pulikkal Division",
            subtitle: "Empowering Students, Enriching Society",
            btn1Text: "Latest Updates",
            btn1Link: "#news",
            btn2Text: "About Us",
            btn2Link: "#about",
        },
    });

    // Seed Contact
    await prisma.contact.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            address: "Students' Centre, Siyamkandam, Pulikkal, Malappuram",
            phone: "+91 0000 000 000",
            email: "ssf@pulikkal.com",
            mapEmbed: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d15656.762955313!2d75.918!3d11.166!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDEwJzU3LjYiTiA3NcKwNTUnMDQuOCJF!5e0!3m2!1sen!2sin!4v1234567890",
        },
    });

    // Seed Footer
    await prisma.footer.upsert({
        where: { id: 1 },
        update: {},
        create: {
            id: 1,
            aboutText: "SSF Pulikkal Division is a student organization dedicated to the moral and social empowerment of students.",
            socialLinks: JSON.stringify({
                facebook: "https://facebook.com",
                instagram: "https://instagram.com",
                twitter: "https://twitter.com",
                youtube: "https://youtube.com",
            }),
            copyright: "© 2024 SSF Pulikkal Division. All rights reserved.",
        },
    });

    console.log("✅ Seeding complete!");
    console.log("Admin: admin / admin123");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
