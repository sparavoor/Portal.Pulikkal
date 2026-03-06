import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSectorSession } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getSectorSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const unitId = searchParams.get("unitId");
    const status = searchParams.get("status");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = { sectorId: session.sectorId };
    if (unitId) where.unitId = parseInt(unitId);
    if (status === "Admitted") where.admitted = true;
    if (status === "Not Admitted") where.admitted = false;

    const registrations = await prisma.registration.findMany({
        where,
        include: { sector: true, unit: true },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(registrations);
}
