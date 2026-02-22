import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const prismaClientSingleton = () => {
    try {
        const isProduction = process.env.NODE_ENV === "production";
        const connectionString = process.env.DATABASE_URL;

        if (!connectionString) {
            console.error("❌ DATABASE_URL is not defined in environment variables.");
            return new PrismaClient();
        }

        // Descriptive logging for debugging (Password is masked)
        if (isProduction) {
            const masked = connectionString.replace(/:([^:@]+)@/, ":****@");
            console.log(`🔌 Connecting to Database: ${masked}`);
        }

        const pool = new pg.Pool({
            connectionString,
            ssl: isProduction ? { rejectUnauthorized: false } : false,
            max: 1, // Recommended for Serverless
            connectionTimeoutMillis: 15000,
            idleTimeoutMillis: 30000,
        });

        pool.on('error', (err) => {
            console.error('❌ Unexpected error on idle database client', err);
        });

        const adapter = new PrismaPg(pool);
        return new PrismaClient({ adapter } as any);
    } catch (error: any) {
        console.error("🚨 Failed to initialize Prisma Client:", error.message);
        throw error;
    }
};

declare global {
    var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;

export default prisma;
