import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return NextResponse.json(map);
}

export async function PUT(req: Request) {
    const session = await getAdminSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const updates: Record<string, string> = await req.json();
    for (const [key, value] of Object.entries(updates)) {
        await prisma.setting.upsert({
            where: { key },
            update: { value },
            create: { key, value },
        });
    }
    return NextResponse.json({ success: true });
}
