import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
    const sectors = await prisma.sector.findMany()
    for (const s of sectors) {
        if (!s.slug) await prisma.sector.update({ where: { id: s.id }, data: { slug: Math.random().toString(36).substring(2, 8) } })
    }
}
main()
