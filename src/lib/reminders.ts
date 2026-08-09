import { prisma } from "@/lib/prisma";
import { DELIVERABLE_STATUSES, HOURS_STATUSES } from "@/lib/constants";

// Sin infraestructura de cron en este stack: se corre como verificación al
// cargar el dashboard de asesor/organización y coordinación (ver page.tsx),
// además de exponerse vía /api/cron/reminders para quien quiera engancharla
// a un scheduler real en producción.
export const REMINDER_THRESHOLD_DAYS = 3;
export const REMINDER_COOLDOWN_DAYS = 3;

function daysAgo(days: number) {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

async function alreadyReminded(advisorId: string, marker: string) {
  const existing = await prisma.notification.findFirst({
    where: {
      userId: advisorId,
      link: marker,
      createdAt: { gte: daysAgo(REMINDER_COOLDOWN_DAYS) },
    },
  });
  return existing !== null;
}

export async function runOverdueReminders() {
  const cutoff = daysAgo(REMINDER_THRESHOLD_DAYS);

  const overdueHours = await prisma.hoursLog.findMany({
    where: { status: HOURS_STATUSES.PENDING, createdAt: { lte: cutoff } },
    include: { studentProfile: { include: { user: true } } },
  });

  for (const log of overdueHours) {
    const advisorId = log.studentProfile.advisorId;
    if (!advisorId) continue;

    const marker = `/dashboard?remind=hours:${log.id}`;
    if (await alreadyReminded(advisorId, marker)) continue;

    await prisma.notification.create({
      data: {
        userId: advisorId,
        message: `Recordatorio: el registro de ${log.hours} horas de ${log.studentProfile.user.name} lleva más de ${REMINDER_THRESHOLD_DAYS} días pendiente de tu aprobación.`,
        link: marker,
      },
    });
  }

  const overdueDeliverables = await prisma.deliverable.findMany({
    where: { status: DELIVERABLE_STATUSES.PENDING, submittedAt: { lte: cutoff } },
    include: { studentProfile: { include: { user: true } } },
  });

  for (const deliverable of overdueDeliverables) {
    const advisorId = deliverable.studentProfile.advisorId;
    if (!advisorId) continue;

    const marker = `/dashboard?remind=deliverable:${deliverable.id}`;
    if (await alreadyReminded(advisorId, marker)) continue;

    await prisma.notification.create({
      data: {
        userId: advisorId,
        message: `Recordatorio: el entregable "${deliverable.title}" de ${deliverable.studentProfile.user.name} lleva más de ${REMINDER_THRESHOLD_DAYS} días pendiente de revisión.`,
        link: marker,
      },
    });
  }
}
