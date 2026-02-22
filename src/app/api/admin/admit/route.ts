import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// Scan/admit a registration
export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { regId } = await req.json();
    if (!regId) return NextResponse.json({ error: "regId required" }, { status: 400 });

    const reg = await prisma.registration.findUnique({
        where: { regId },
        include: { sector: true, unit: true },
    });

    if (!reg) return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    if (reg.admitted) {
        return NextResponse.json({
            error: "Already admitted",
            alreadyAdmitted: true,
            registration: reg,
        }, { status: 409 });
    }

    const updated = await prisma.registration.update({
        where: { regId },
        data: { admitted: true, admissionTime: new Date() },
        include: { sector: true, unit: true },
    });

    return NextResponse.json({ success: true, registration: updated });
}
