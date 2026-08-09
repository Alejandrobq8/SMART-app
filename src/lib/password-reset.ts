import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

export async function createResetToken(userId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await prisma.passwordResetToken.create({
    data: { token, userId, expiresAt },
  });

  return token;
}

export async function consumeResetToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) throw new Error("El enlace de recuperación no es válido.");
  if (record.usedAt) throw new Error("Este enlace ya fue utilizado.");
  if (record.expiresAt < new Date()) throw new Error("Este enlace expiró.");

  await prisma.passwordResetToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  return record.userId;
}
