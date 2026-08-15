import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  assignStudent,
  logHours,
  reviewHours,
  submitDeliverable,
} from "@/lib/actions";
import { studentSelectorEmptyMessage } from "@/lib/ui-copy";
import { mockGetSession } from "./setup";

async function createAdvisor(processType: string = "TCU") {
  return prisma.user.create({
    data: {
      name: "Asesor de prueba",
      email: `advisor-${crypto.randomUUID()}@test.local`,
      passwordHash: "x",
      role: "ADVISOR",
      advisorProcessType: processType,
    },
  });
}

async function createStudentWithProfile(overrides: {
  requiredHours?: number;
  advisorId?: string;
  organizationId?: string | null;
  status?: string;
}) {
  const user = await prisma.user.create({
    data: {
      name: "Estudiante de prueba",
      email: `student-${crypto.randomUUID()}@test.local`,
      passwordHash: "x",
      role: "STUDENT",
    },
  });
  const profile = await prisma.studentProfile.create({
    data: {
      userId: user.id,
      studentCode: `code-${crypto.randomUUID()}`,
      career: "Ingeniería en Sistemas",
      processType: "TCU",
      requiredHours: overrides.requiredHours ?? 10,
      advisorId: overrides.advisorId,
      organizationId: overrides.organizationId,
      status: overrides.status ?? "NOT_STARTED",
    },
  });
  return { user, profile };
}

// Regresión de 1776e55: un expediente con horas aprobadas suficientes pero
// CERO entregables no debe quedar en COMPLETED.
describe("recomputeStatus (vía reviewHours) — bug 1776e55", () => {
  it("no marca COMPLETED cuando no hay entregables, aunque las horas alcancen", async () => {
    const advisor = await createAdvisor();
    const { profile } = await createStudentWithProfile({
      requiredHours: 10,
      advisorId: advisor.id,
    });
    const log = await prisma.hoursLog.create({
      data: {
        studentProfileId: profile.id,
        date: new Date(),
        hours: 10,
        description: "Trabajo de campo",
        status: "PENDING",
      },
    });

    mockGetSession.mockResolvedValue({
      userId: advisor.id,
      role: "ADVISOR",
      name: advisor.name,
      email: advisor.email,
    });

    const formData = new FormData();
    formData.set("hoursLogId", log.id);
    formData.set("decision", "APPROVED");
    await reviewHours(formData);

    const updated = await prisma.studentProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });
    expect(updated.status).not.toBe("COMPLETED");
    expect(updated.status).toBe("DELIVERABLES_PENDING");
  });
});

// Regresión de 1776e55: cierre prematuro / reapertura tras completado.
describe("bloqueo de horas/entregables tras cierre — bug 1776e55", () => {
  it("logHours lanza si el expediente ya está COMPLETED", async () => {
    const { user, profile } = await createStudentWithProfile({
      status: "COMPLETED",
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
    formData.set("description", "Actividad post-cierre");

    await expect(logHours(formData)).rejects.toThrow(
      /ya fue completado/i
    );

    const logsAfter = await prisma.hoursLog.count({
      where: { studentProfileId: profile.id },
    });
    expect(logsAfter).toBe(0);
  });

  it("submitDeliverable lanza si el expediente ya está COMPLETED", async () => {
    const { user, profile } = await createStudentWithProfile({
      status: "COMPLETED",
    });
    mockGetSession.mockResolvedValue({
      userId: user.id,
      role: "STUDENT",
      name: user.name,
      email: user.email,
    });

    const formData = new FormData();
    formData.set("title", "Informe tardío");

    await expect(submitDeliverable(formData)).rejects.toThrow(
      /ya fue completado/i
    );

    const deliverablesAfter = await prisma.deliverable.count({
      where: { studentProfileId: profile.id },
    });
    expect(deliverablesAfter).toBe(0);
  });
});

// Regresión de a536d30: bloqueo de cambio de organización con proceso en curso.
describe("assignStudent — bloqueo de cambio de organización — bug a536d30", () => {
  it("lanza si se intenta cambiar la organización con el proceso en progreso", async () => {
    const advisor = await createAdvisor();
    const org1 = await prisma.organization.create({ data: { name: "Org 1" } });
    const org2 = await prisma.organization.create({ data: { name: "Org 2" } });
    const { profile } = await createStudentWithProfile({
      advisorId: advisor.id,
      organizationId: org1.id,
      status: "IN_PROGRESS",
    });

    mockGetSession.mockResolvedValue({
      userId: advisor.id,
      role: "COORDINATION",
      name: "Coordinación",
      email: "coordinacion@test.local",
    });

    const formData = new FormData();
    formData.set("studentProfileId", profile.id);
    formData.set("advisorId", advisor.id);
    formData.set("organizationId", org2.id);

    await expect(assignStudent(formData)).rejects.toThrow(
      /organización/i
    );

    const unchanged = await prisma.studentProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });
    expect(unchanged.organizationId).toBe(org1.id);
  });

  it("permite cambiar solo el asesor con el proceso en progreso, sin tocar la organización", async () => {
    const advisor1 = await createAdvisor();
    const advisor2 = await createAdvisor();
    const org1 = await prisma.organization.create({ data: { name: "Org 1" } });
    const { profile } = await createStudentWithProfile({
      advisorId: advisor1.id,
      organizationId: org1.id,
      status: "IN_PROGRESS",
    });

    mockGetSession.mockResolvedValue({
      userId: advisor1.id,
      role: "COORDINATION",
      name: "Coordinación",
      email: "coordinacion@test.local",
    });

    const formData = new FormData();
    formData.set("studentProfileId", profile.id);
    formData.set("advisorId", advisor2.id);
    formData.set("organizationId", org1.id);

    await expect(assignStudent(formData)).resolves.not.toThrow();

    const updated = await prisma.studentProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });
    expect(updated.advisorId).toBe(advisor2.id);
    expect(updated.organizationId).toBe(org1.id);
  });

  it("permite asignar organización cuando el proceso aún no ha iniciado", async () => {
    const advisor = await createAdvisor();
    const org1 = await prisma.organization.create({ data: { name: "Org 1" } });
    const { profile } = await createStudentWithProfile({
      advisorId: advisor.id,
      status: "NOT_STARTED",
    });

    mockGetSession.mockResolvedValue({
      userId: advisor.id,
      role: "COORDINATION",
      name: "Coordinación",
      email: "coordinacion@test.local",
    });

    const formData = new FormData();
    formData.set("studentProfileId", profile.id);
    formData.set("advisorId", advisor.id);
    formData.set("organizationId", org1.id);

    await expect(assignStudent(formData)).resolves.not.toThrow();

    const updated = await prisma.studentProfile.findUniqueOrThrow({
      where: { id: profile.id },
    });
    expect(updated.organizationId).toBe(org1.id);
  });
});

// Regresión de 44d51b7: mensaje explicativo cuando no hay estudiantes
// pendientes de expediente, en vez de un <select> vacío y confuso.
describe("studentSelectorEmptyMessage — bug 44d51b7", () => {
  it("devuelve el mensaje explicativo cuando no hay estudiantes disponibles", () => {
    expect(studentSelectorEmptyMessage(0)).toMatch(/pendientes de expediente/i);
  });

  it("devuelve null cuando sí hay estudiantes disponibles", () => {
    expect(studentSelectorEmptyMessage(3)).toBeNull();
  });
});
