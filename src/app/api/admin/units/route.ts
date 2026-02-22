import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const units = await prisma.unit.findMany({
        include: { sector: true },
        orderBy: { name: "asc" },
    });
    return NextResponse.json(units);
}

export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, sectorId } = await req.json();
    if (!name?.trim() || !sectorId) return NextResponse.json({ error: "Name and sectorId required" }, { status: 400 });
    try {
        const unit = await prisma.unit.create({ data: { name: name.trim(), sectorId: parseInt(sectorId) } });
        return NextResponse.json(unit);
    } catch {
        return NextResponse.json({ error: "Unit already exists in this sector" }, { status: 409 });
    }
}

export async function DELETE(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.unit.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

export async function PUT(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, name } = await req.json();
    const unit = await prisma.unit.update({ where: { id }, data: { name: name.trim() } });
    return NextResponse.json(unit);
}
