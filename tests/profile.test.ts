import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { changePassword, updateProfile } from "@/lib/actions";
import { verifyPassword } from "@/lib/auth";
import { mockGetSession } from "./setup";

async function createUser(password = "123456") {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      name: "Nombre original",
      email: `user-${crypto.randomUUID()}@test.local`,
      passwordHash,
      role: "STUDENT",
    },
  });
}

function mockSessionFor(user: { id: string; role: string; name: string; email: string }) {
  mockGetSession.mockResolvedValue({
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
  });
}

describe("updateProfile", () => {
  it("actualiza nombre y teléfono del usuario en sesión", async () => {
    const user = await createUser();
    mockSessionFor(user);

    const formData = new FormData();
    formData.set("name", "Nombre actualizado");
    formData.set("phone", "8888-8888");
    await updateProfile(formData);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(updated.name).toBe("Nombre actualizado");
    expect(updated.phone).toBe("8888-8888");
  });

  it("lanza si el nombre queda vacío", async () => {
    const user = await createUser();
    mockSessionFor(user);

    const formData = new FormData();
    formData.set("name", "   ");
    await expect(updateProfile(formData)).rejects.toThrow(/nombre/i);
  });
});

describe("changePassword", () => {
  it("cambia la contraseña cuando la actual es correcta", async () => {
    const user = await createUser("clave-actual");
    mockSessionFor(user);

    const formData = new FormData();
    formData.set("currentPassword", "clave-actual");
    formData.set("newPassword", "clave-nueva");
    await changePassword(formData);

    const updated = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword("clave-nueva", updated.passwordHash)).toBe(true);
    expect(await verifyPassword("clave-actual", updated.passwordHash)).toBe(false);
  });

  it("rechaza si la contraseña actual no coincide", async () => {
    const user = await createUser("clave-actual");
    mockSessionFor(user);

    const formData = new FormData();
    formData.set("currentPassword", "clave-incorrecta");
    formData.set("newPassword", "clave-nueva");
    await expect(changePassword(formData)).rejects.toThrow(/no es correcta/i);

    const unchanged = await prisma.user.findUniqueOrThrow({ where: { id: user.id } });
    expect(await verifyPassword("clave-actual", unchanged.passwordHash)).toBe(true);
  });
});
