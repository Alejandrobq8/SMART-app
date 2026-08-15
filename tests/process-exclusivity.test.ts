import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { createStudentProfile } from "@/lib/actions";
import { mockGetSession } from "./setup";

async function createStudentUser() {
  return prisma.user.create({
    data: {
      name: "Estudiante de prueba",
      email: `student-${crypto.randomUUID()}@test.local`,
      passwordHash: "x",
      role: "STUDENT",
    },
  });
}

function mockCoordination() {
  mockGetSession.mockResolvedValue({
    userId: "coord-1",
    role: "COORDINATION",
    name: "Coordinación",
    email: "coordinacion@test.local",
  });
}

// Regla: un estudiante no puede hacer TCU y Práctica al mismo tiempo.
describe("createStudentProfile — exclusividad de proceso", () => {
  it("lanza si el usuario ya tiene un expediente", async () => {
    const user = await createStudentUser();
    await prisma.studentProfile.create({
      data: {
        userId: user.id,
        studentCode: `code-${crypto.randomUUID()}`,
        career: "Ingeniería en Sistemas",
        processType: "TCU",
      },
    });
    mockCoordination();

    const formData = new FormData();
    formData.set("userId", user.id);
    formData.set("studentCode", "0000000000");
    formData.set("career", "Ingeniería en Sistemas");
    formData.set("processType", "PRACTICE");

    await expect(createStudentProfile(formData)).rejects.toThrow(
      /ya tiene un expediente/i
    );
  });
});
