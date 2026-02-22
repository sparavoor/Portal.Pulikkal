import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

// GET /api/admin/sectors
export async function GET() {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sectors = await prisma.sector.findMany({
        include: { units: { orderBy: { name: "asc" } }, _count: { select: { registrations: true } } },
        orderBy: { name: "asc" },
    });
    return NextResponse.json(sectors);
}

// POST /api/admin/sectors
export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name } = await req.json();
    if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
    try {
        const trimmedName = name.trim();
        const slug = trimmedName.toLowerCase().replace(/\s+/g, "-");
        const sector = await prisma.sector.create({ data: { name: trimmedName, slug } });
        return NextResponse.json(sector);
    } catch {
        return NextResponse.json({ error: "Sector or Slug already exists" }, { status: 409 });
    }
}

// DELETE /api/admin/sectors?id=X
export async function DELETE(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    await prisma.sector.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

// PUT /api/admin/sectors
export async function PUT(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, name } = await req.json();
    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/\s+/g, "-");
    const sector = await prisma.sector.update({ where: { id }, data: { name: trimmedName, slug } });
    return NextResponse.json(sector);
}
