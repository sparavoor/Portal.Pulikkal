import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    try {
        const sectors = await prisma.sector.findMany({
            include: { units: { orderBy: { name: "asc" } } },
            orderBy: { name: "asc" },
        });
        return NextResponse.json(sectors);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
