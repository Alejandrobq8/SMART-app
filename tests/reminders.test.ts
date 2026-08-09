import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { runOverdueReminders } from "@/lib/reminders";

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

async function createStudentWithHoursLog(advisorId: string, createdAt: Date) {
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
      advisorId,
    },
  });
  const log = await prisma.hoursLog.create({
    data: {
      studentProfileId: profile.id,
      date: createdAt,
      hours: 4,
      description: "Actividad",
      status: "PENDING",
    },
  });
  // createdAt tiene @default(now()), así que se sobrescribe directo en la DB
  // para simular un registro viejo sin depender de esperar tiempo real.
  await prisma.hoursLog.update({ where: { id: log.id }, data: { createdAt } });
  return { profile, log };
}

describe("runOverdueReminders", () => {
  it("no genera recordatorio para horas pendientes recientes", async () => {
    const advisor = await createAdvisor();
    await createStudentWithHoursLog(advisor.id, new Date());

    await runOverdueReminders();

    const notifications = await prisma.notification.findMany({
      where: { userId: advisor.id },
    });
    expect(notifications).toHaveLength(0);
  });

  it("genera recordatorio para horas pendientes con más de 3 días", async () => {
    const advisor = await createAdvisor();
    const old = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await createStudentWithHoursLog(advisor.id, old);

    await runOverdueReminders();

    const notifications = await prisma.notification.findMany({
      where: { userId: advisor.id },
    });
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toMatch(/recordatorio/i);
  });

  it("no duplica el recordatorio si se corre dos veces seguidas", async () => {
    const advisor = await createAdvisor();
    const old = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    await createStudentWithHoursLog(advisor.id, old);

    await runOverdueReminders();
    await runOverdueReminders();

    const notifications = await prisma.notification.findMany({
      where: { userId: advisor.id },
    });
    expect(notifications).toHaveLength(1);
  });
});
