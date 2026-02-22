import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public settings (registration_status, page content)
export async function GET() {
    try {
        const settings = await prisma.setting.findMany();
        const map: Record<string, string> = {};
        settings.forEach((s) => { map[s.key] = s.value; });
        return NextResponse.json(map);
    } catch (e) {
        console.error("Prisma Error:", e);
        return NextResponse.json({ error: "Failed to load settings" }, { status: 500 });
    }
}
