import { NextResponse } from "next/server";

export async function GET() {
    const url = process.env.DATABASE_URL || "";
    const maskedUrl = url.replace(/:([^:@]+)@/, ":****@");

    return NextResponse.json({
        hasUrl: !!url,
        urlPreview: maskedUrl,
        nodeEnv: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
    });
}
