import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function pushToDataBase(tokens: number) {
    const res = await prisma.gptUsage.create({
        data: {
            tokens: tokens,
        },
    });
    return res;
}
