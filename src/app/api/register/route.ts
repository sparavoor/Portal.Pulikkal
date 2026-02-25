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

        // Generate unique regId - Use retry logic to avoid P2002 collisions
        let regId = "";
        let qrData = "";
        let registration = null;
        let attempts = 0;

        while (attempts < 5) {
            attempts++;
            const lastReg = await prisma.registration.findFirst({
                orderBy: { id: "desc" },
                select: { id: true }
            });
            const nextId = (lastReg?.id || 0) + attempts;
            regId = `REG-${String(nextId).padStart(4, "0")}`;
            qrData = JSON.stringify({ regId, name, mobile });

            try {
                registration = await prisma.registration.create({
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
                break; // Successfully inserted
            } catch (error: any) {
                if (error.code === 'P2002') {
                    // Collision on regId, loop again to generate a new one
                    continue;
                }
                throw error; // Other database errors
            }
        }

        if (!registration) {
            return NextResponse.json({ error: "Failed to generate a unique registration ID after multiple attempts." }, { status: 500 });
        }

        return NextResponse.json({ success: true, registration });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
