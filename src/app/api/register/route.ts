import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Check if mobile is already registered
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mobile = searchParams.get("mobile");
    if (!mobile) return NextResponse.json({ error: "Mobile required" }, { status: 400 });
    const reg = await prisma.registration.findUnique({
        where: { mobile },
        include: { sector: true, unit: true },
    });
    return NextResponse.json({ exists: !!reg, registration: reg });
}

// Submit new registration
export async function POST(req: Request) {
    try {
        // Check registration status
        const statusSetting = await prisma.setting.findUnique({ where: { key: "registration_status" } });
        if (statusSetting?.value !== "open") {
            return NextResponse.json({ error: "Registration is currently closed." }, { status: 403 });
        }

        const { name, mobile, designation, sectorId, unitId } = await req.json();

        if (!name || !mobile || !designation || !sectorId || !unitId) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        // Check duplicate mobile
        const existing = await prisma.registration.findUnique({ where: { mobile } });
        if (existing) {
            return NextResponse.json({ error: "This mobile number is already registered." }, { status: 409 });
        }

        // Generate unique regId
        const count = await prisma.registration.count();
        const regId = `REG-${String(count + 1).padStart(4, "0")}`;

        // Generate QR code data (we store the data, client renders QR)
        const qrData = JSON.stringify({ regId, name, mobile });

        const registration = await prisma.registration.create({
            data: {
                regId,
                name: name.trim(),
                mobile: mobile.trim(),
                designation,
                sectorId: parseInt(sectorId),
                unitId: parseInt(unitId),
                qrCode: qrData,
            },
            include: { sector: true, unit: true },
        });

        return NextResponse.json({ success: true, registration });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
