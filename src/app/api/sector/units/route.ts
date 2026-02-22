import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSectorSession } from "@/lib/auth";

export async function GET() {
    const session = await getSectorSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const units = await prisma.unit.findMany({
        where: { sectorId: session.sectorId },
        orderBy: { name: "asc" },
    });
    return NextResponse.json(units);
}
