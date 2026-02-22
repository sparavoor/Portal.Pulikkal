import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Public settings (registration_status, page content)
export async function GET() {
    const settings = await prisma.setting.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => { map[s.key] = s.value; });
    return NextResponse.json(map);
}
