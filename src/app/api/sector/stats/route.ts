import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSectorSession } from "@/lib/auth";

export async function GET() {
    const session = await getSectorSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const [total, admitted, units] = await Promise.all([
        prisma.registration.count({ where: { sectorId: session.sectorId } }),
        prisma.registration.count({ where: { sectorId: session.sectorId, admitted: true } }),
        prisma.registration.groupBy({
            by: ["unitId"],
            where: { sectorId: session.sectorId },
            _count: { _all: true },
        }),
    ]);

    const unitIds = units.map((u) => u.unitId);
    const unitList = await prisma.unit.findMany({ where: { id: { in: unitIds } } });

    const unitStats = units.map((u) => ({
        name: unitList.find((ul) => ul.id === u.unitId)?.name || "Unknown",
        id: u.unitId,
        count: u._count._all,
    }));

    return NextResponse.json({ total, admitted, unitStats });
}
