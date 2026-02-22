import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

function createPrismaClient() {
    const isProduction = process.env.NODE_ENV === "production";
    const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false,
        max: 1,
        connectionTimeoutMillis: 15000,
        idleTimeoutMillis: 30000,
    });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
