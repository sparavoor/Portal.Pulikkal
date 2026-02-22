import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const sectorId = searchParams.get("sectorId");
    const unitId = searchParams.get("unitId");
    const designation = searchParams.get("designation");
    const date = searchParams.get("date");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { mobile: { contains: search } },
            { regId: { contains: search } },
        ];
    }
    if (sectorId) where.sectorId = parseInt(sectorId);
    if (unitId) where.unitId = parseInt(unitId);
    if (designation) where.designation = designation;
    if (date) {
        const d = new Date(date);
        where.createdAt = {
            gte: d,
            lt: new Date(d.getTime() + 86400000),
        };
    }

    const registrations = await prisma.registration.findMany({
        where,
        include: { sector: true, unit: true },
        orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(registrations);
}

export async function DELETE(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");
    await prisma.registration.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
