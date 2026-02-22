import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";
import bcrypt from "bcryptjs";

// GET /api/admin/sector-admins
export async function GET() {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const admins = await prisma.sectorAdmin.findMany({
        include: { sector: true },
        orderBy: { username: "asc" },
    });
    return NextResponse.json(admins);
}

// POST /api/admin/sector-admins
export async function POST(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { username, password, sectorId } = await req.json();

        if (!username || !password || !sectorId) {
            return NextResponse.json({ error: "All fields are required" }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const admin = await prisma.sectorAdmin.create({
            data: {
                username: username.trim(),
                password: hashedPassword,
                sectorId: parseInt(sectorId),
            },
            include: { sector: true },
        });

        return NextResponse.json(admin);
    } catch (e: unknown) {
        if (e && typeof e === 'object' && 'code' in e && e.code === 'P2002') {
            return NextResponse.json({ error: "Username or Sector already has an admin" }, { status: 409 });
        }
        return NextResponse.json({ error: "Failed to create sector admin" }, { status: 500 });
    }
}

// DELETE /api/admin/sector-admins?id=X
export async function DELETE(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = parseInt(searchParams.get("id") || "");

    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    await prisma.sectorAdmin.delete({ where: { id } });
    return NextResponse.json({ success: true });
}

// PUT /api/admin/sector-admins
export async function PUT(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const { id, username, password, sectorId } = await req.json();

        const data: Record<string, string | number> = {};
        if (username) data.username = username.trim();
        if (password) data.password = await bcrypt.hash(password, 10);
        if (sectorId) data.sectorId = parseInt(sectorId);

        const admin = await prisma.sectorAdmin.update({
            where: { id },
            data,
            include: { sector: true },
        });

        return NextResponse.json(admin);
    } catch {
        return NextResponse.json({ error: "Failed to update sector admin" }, { status: 500 });
    }
}
