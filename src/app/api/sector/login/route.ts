import { NextResponse } from "next/server";
import { signToken } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();
        const sectorAdmin = await prisma.sectorAdmin.findUnique({
            where: { username },
            include: { sector: true },
        });
        if (!sectorAdmin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        const valid = await bcrypt.compare(password, sectorAdmin.password);
        if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        const token = signToken({
            id: sectorAdmin.id,
            username: sectorAdmin.username,
            sectorId: sectorAdmin.sectorId,
            sectorName: sectorAdmin.sector.name,
            role: "sector",
        });
        const res = NextResponse.json({
            success: true,
            username: sectorAdmin.username,
            sectorId: sectorAdmin.sectorId,
            sectorName: sectorAdmin.sector.name,
        });
        res.cookies.set("sector_token", token, {
            httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax",
        });
        return res;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
