import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    const [total, todayCount, admitted, sectors, units, designations] = await Promise.all([
        prisma.registration.count(),
        prisma.registration.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
        prisma.registration.count({ where: { admitted: true } }),
        prisma.registration.groupBy({
            by: ["sectorId"],
            _count: { _all: true },
        }),
        prisma.registration.groupBy({
            by: ["unitId"],
            _count: { _all: true },
        }),
        prisma.registration.groupBy({
            by: ["designation"],
            _count: { _all: true },
        }),
    ]);

    const sectorIds = sectors.map((s) => s.sectorId);
    const unitIds = units.map((u) => u.unitId);

    const [sectorList, unitList] = await Promise.all([
        prisma.sector.findMany({ where: { id: { in: sectorIds } } }),
        prisma.unit.findMany({ where: { id: { in: unitIds } } }),
    ]);

    const sectorStats = sectors.map((s) => ({
        name: sectorList.find((sl) => sl.id === s.sectorId)?.name || "Unknown",
        count: s._count._all,
    }));

    const unitStats = units.map((u) => ({
        name: unitList.find((ul) => ul.id === u.unitId)?.name || "Unknown",
        count: u._count._all,
    }));

    const designationStats = designations.map((d) => ({
        name: d.designation,
        count: d._count._all,
    }));

    return NextResponse.json({
        total,
        todayCount,
        admitted,
        sectorStats,
        unitStats,
        designationStats,
    });
}
