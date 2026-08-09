import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { consumeResetToken, createResetToken } from "@/lib/password-reset";
import { hashPassword, verifyPassword } from "@/lib/auth";

async function createUser() {
  return prisma.user.create({
    data: {
      name: "Estudiante de prueba",
      email: `user-${crypto.randomUUID()}@test.local`,
      passwordHash: await bcrypt.hash("clave-original", 10),
      role: "STUDENT",
    },
  });
}

describe("createResetToken / consumeResetToken", () => {
  it("un token válido permite obtener el userId y cambiar la contraseña", async () => {
    const user = await createUser();
    const token = await createResetToken(user.id);

    const userId = await consumeResetToken(token);
    expect(userId).toBe(user.id);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword("clave-nueva") },
    });

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword("clave-nueva", updated.passwordHash)).toBe(true);
  });

  it("lanza si el token ya fue usado", async () => {
    const user = await createUser();
    const token = await createResetToken(user.id);

    await consumeResetToken(token);
    await expect(consumeResetToken(token)).rejects.toThrow(/ya fue utilizado/i);
  });

  it("lanza si el token expiró", async () => {
    const user = await createUser();
    const token = await createResetToken(user.id);

    // Forzar expiración retrocediendo expiresAt directamente en la DB.
    await prisma.passwordResetToken.update({
      where: { token },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    await expect(consumeResetToken(token)).rejects.toThrow(/expiró/i);
  });

  it("lanza si el token no existe", async () => {
    await expect(consumeResetToken("token-inexistente")).rejects.toThrow(
      /no es válido/i
    );
  });
});
