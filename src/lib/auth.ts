import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET || "ssf-pulikkal-portal-secret-2024";

export function signToken(payload: object, expiresIn = "7d") {
    return jwt.sign(payload, JWT_SECRET, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(token: string) {
    try {
        return jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    } catch {
        return null;
    }
}

export async function getAdminSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("admin_token")?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload || payload.role !== "admin") return null;
    return payload;
}

export async function getSectorSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get("sector_token")?.value;
    if (!token) return null;
    const payload = verifyToken(token);
    if (!payload || payload.role !== "sector") return null;
    return payload;
}
