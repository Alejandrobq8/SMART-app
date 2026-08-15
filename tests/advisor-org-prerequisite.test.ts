import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { logHours, submitDeliverable } from "@/lib/actions";
import { mockGetSession } from "./setup";

async function createAdvisor() {
  return prisma.user.create({
    data: {
      name: "Asesor de prueba",
      email: `advisor-${crypto.randomUUID()}@test.local`,
      passwordHash: "x",
      role: "ADVISOR",
    },
  });
}

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

async function createStudentProfileDirect(overrides: {
  userId: string;
  advisorId?: string;
  organizationId?: string | null;
}) {
  return prisma.studentProfile.create({
    data: {
      userId: overrides.userId,
      studentCode: `code-${crypto.randomUUID()}`,
      career: "Ingeniería en Sistemas",
      processType: "TCU",
      advisorId: overrides.advisorId,
      organizationId: overrides.organizationId,
    },
  });
}

// Regla: no se puede iniciar el proceso sin asesor y organización asignados.
describe("logHours / submitDeliverable — prerrequisito asesor + organización", () => {
  it("logHours lanza si no hay asesor ni organización asignados", async () => {
    const user = await createStudentUser();
    await createStudentProfileDirect({ userId: user.id });
    mockGetSession.mockResolvedValue({
      userId: user.id,
      role: "STUDENT",
      name: user.name,
      email: user.email,
    });

    const formData = new FormData();
    formData.set("date", "2026-01-01");
    formData.set("hours", "2");
    formData.set("description", "Actividad");

    await expect(logHours(formData)).rejects.toThrow(
      /un profesor asesor y una organización/i
    );
  });

  it("logHours lanza si solo falta la organización", async () => {
    const advisor = await createAdvisor();
    const user = await createStudentUser();
    await createStudentProfileDirect({ userId: user.id, advisorId: advisor.id });
    mockGetSession.mockResolvedValue({
      userId: user.id,
      role: "STUDENT",
      name: user.name,
      email: user.email,
    });

    const formData = new FormData();
    formData.set("date", "2026-01-01");
    formData.set("hours", "2");
    formData.set("description", "Actividad");

    await expect(logHours(formData)).rejects.toThrow(/una organización/i);
  });

  it("logHours funciona si ya tiene asesor y organización", async () => {
    const advisor = await createAdvisor();
    const org = await prisma.organization.create({ data: { name: "Org de prueba" } });
    const user = await createStudentUser();
    await createStudentProfileDirect({
      userId: user.id,
      advisorId: advisor.id,
      organizationId: org.id,
    });
    mockGetSession.mockResolvedValue({
      userId: user.id,
      role: "STUDENT",
      name: user.name,
      email: user.email,
    });

    const formData = new FormData();
    formData.set("date", "2026-01-01");
    formData.set("hours", "2");
    formData.set("description", "Actividad");

    await expect(logHours(formData)).resolves.not.toThrow();
  });

  it("submitDeliverable lanza si no hay asesor ni organización asignados", async () => {
    const user = await createStudentUser();
    await createStudentProfileDirect({ userId: user.id });
    mockGetSession.mockResolvedValue({
      userId: user.id,
      role: "STUDENT",
      name: user.name,
      email: user.email,
    });

    const formData = new FormData();
    formData.set("title", "Informe");

    await expect(submitDeliverable(formData)).rejects.toThrow(
      /un profesor asesor y una organización/i
    );
  });
});
