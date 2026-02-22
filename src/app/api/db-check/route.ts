import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
    const url = process.env.DATABASE_URL || "";
    const maskedUrl = url.replace(/:([^:@]+)@/, ":****@");

    let dbStatus = "Checking...";
    let errorDetail = null;

    try {
        await prisma.$queryRaw`SELECT 1`;
        dbStatus = "Connected Successfully!";
    } catch (e: any) {
        dbStatus = "Connection Failed";
        errorDetail = {
            message: e.message,
            code: e.code,
            meta: e.meta,
            stack: e.stack
        };
    }

    return NextResponse.json({
        status: dbStatus,
        hasUrl: !!url,
        urlPreview: maskedUrl,
        error: errorDetail,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
