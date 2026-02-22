import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();
        const admin = await prisma.admin.findUnique({ where: { username } });
        if (!admin) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        const valid = await bcrypt.compare(password, admin.password);
        if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        const token = signToken({ id: admin.id, username: admin.username, role: "admin" });
        const res = NextResponse.json({ success: true, username: admin.username });
        res.cookies.set("admin_token", token, {
            httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7, sameSite: "lax",
        });
        return res;
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
}
