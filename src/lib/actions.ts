"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  DELIVERABLE_STATUSES,
  HOURS_STATUSES,
  PROCESS_STATUSES,
  ROLES,
  type Role,
} from "@/lib/constants";

async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("No autenticado.");
  return session;
}

async function notify(userId: string, message: string, link?: string) {
  await prisma.notification.create({
    data: { userId, message, link },
  });
}

async function recomputeStatus(studentProfileId: string) {
  const profile = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentProfileId },
    include: { hoursLogs: true, deliverables: true },
  });

  const approvedHours = profile.hoursLogs
    .filter((h) => h.status === HOURS_STATUSES.APPROVED)
    .reduce((sum, h) => sum + h.hours, 0);

  // Completo solo si existe al menos un entregable y todos están aprobados.
  // Un arreglo vacío de entregables NO cuenta como "sin pendientes": .some()
  // sobre [] da false, lo que antes marcaba el proceso como completado sin
  // que el estudiante hubiera enviado nunca un entregable.
  const allDeliverablesApproved =
    profile.deliverables.length > 0 &&
    profile.deliverables.every((d) => d.status === DELIVERABLE_STATUSES.APPROVED);

  let status: string = PROCESS_STATUSES.NOT_STARTED;
  if (approvedHours > 0 || profile.deliverables.length > 0) {
    status = PROCESS_STATUSES.IN_PROGRESS;
  }
  if (approvedHours >= profile.requiredHours) {
    status = allDeliverablesApproved
      ? PROCESS_STATUSES.COMPLETED
      : PROCESS_STATUSES.DELIVERABLES_PENDING;
  }

  await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: { status },
  });
}

// ---------- Bitácora de horas ----------

export async function logHours(formData: FormData) {
  const session = await requireSession();

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!studentProfile) throw new Error("No tiene un expediente de estudiante.");
  if (studentProfile.status === PROCESS_STATUSES.COMPLETED) {
    throw new Error(
      "El proceso ya fue completado y aprobado. No se pueden registrar más horas."
    );
  }

  const date = String(formData.get("date"));
  const hours = Number(formData.get("hours"));
  const description = String(formData.get("description") ?? "");

  if (!date || !hours || hours <= 0) {
    throw new Error("Fecha y horas válidas son requeridas.");
  }

  await prisma.hoursLog.create({
    data: {
      studentProfileId: studentProfile.id,
      date: new Date(date),
      hours,
      description,
    },
  });

  if (studentProfile.advisorId) {
    await notify(
      studentProfile.advisorId,
      `${session.name} registró ${hours} horas pendientes de aprobación.`,
      "/dashboard"
    );
  }

  revalidatePath("/dashboard");
}

export async function reviewHours(formData: FormData) {
  const session = await requireSession();
  if (!([ROLES.ADVISOR, ROLES.ORGANIZATION] as Role[]).includes(session.role)) {
    throw new Error("No autorizado.");
  }

  const hoursLogId = String(formData.get("hoursLogId"));
  const decision = String(formData.get("decision")); // APPROVED | REJECTED
  const comment = String(formData.get("comment") ?? "");

  const log = await prisma.hoursLog.update({
    where: { id: hoursLogId },
    data: {
      status: decision,
      comment,
      approvedById: session.userId,
      approvedAt: new Date(),
    },
    include: { studentProfile: true },
  });

  await notify(
    log.studentProfile.userId,
    `Tu registro de ${log.hours} horas fue ${
      decision === HOURS_STATUSES.APPROVED ? "aprobado" : "rechazado"
    }.`,
    "/dashboard"
  );

  await recomputeStatus(log.studentProfileId);
  revalidatePath("/dashboard");
}

// ---------- Entregables ----------

export async function submitDeliverable(formData: FormData) {
  const session = await requireSession();

  const studentProfile = await prisma.studentProfile.findUnique({
    where: { userId: session.userId },
  });
  if (!studentProfile) throw new Error("No tiene un expediente de estudiante.");
  if (studentProfile.status === PROCESS_STATUSES.COMPLETED) {
    throw new Error(
      "El proceso ya fue completado y aprobado. No se pueden enviar más entregables."
    );
  }

  const title = String(formData.get("title"));
  const description = String(formData.get("description") ?? "");
  const fileName = String(formData.get("fileName") ?? "");

  if (!title) throw new Error("El título del entregable es requerido.");

  await prisma.deliverable.create({
    data: {
      studentProfileId: studentProfile.id,
      title,
      description,
      fileName: fileName || null,
    },
  });

  if (studentProfile.advisorId) {
    await notify(
      studentProfile.advisorId,
      `${session.name} envió el entregable "${title}" para revisión.`,
      "/dashboard"
    );
  }

  await recomputeStatus(studentProfile.id);
  revalidatePath("/dashboard");
}

export async function reviewDeliverable(formData: FormData) {
  const session = await requireSession();
  if (!([ROLES.ADVISOR, ROLES.ORGANIZATION] as Role[]).includes(session.role)) {
    throw new Error("No autorizado.");
  }

  const deliverableId = String(formData.get("deliverableId"));
  const decision = String(formData.get("decision")); // APPROVED | REJECTED | IN_REVIEW
  const comment = String(formData.get("comment") ?? "");

  const deliverable = await prisma.deliverable.update({
    where: { id: deliverableId },
    data: {
      status: decision,
      comment,
      reviewedById: session.userId,
      reviewedAt: new Date(),
    },
    include: { studentProfile: true },
  });

  await notify(
    deliverable.studentProfile.userId,
    `Tu entregable "${deliverable.title}" fue actualizado a: ${decision}.`,
    "/dashboard"
  );

  await recomputeStatus(deliverable.studentProfileId);
  revalidatePath("/dashboard");
}

// ---------- Asignaciones (coordinación / admin) ----------

export async function assignStudent(formData: FormData) {
  const session = await requireSession();
  if (!([ROLES.COORDINATION, ROLES.ADMIN] as Role[]).includes(session.role)) {
    throw new Error("No autorizado.");
  }

  const studentProfileId = String(formData.get("studentProfileId"));
  const advisorId = String(formData.get("advisorId") ?? "");
  const organizationId = String(formData.get("organizationId") ?? "");

  const current = await prisma.studentProfile.findUniqueOrThrow({
    where: { id: studentProfileId },
  });

  const organizationChanged = organizationId !== (current.organizationId ?? "");
  if (current.status !== PROCESS_STATUSES.NOT_STARTED && organizationChanged) {
    throw new Error(
      "No se puede quitar ni cambiar la organización: el proceso de este estudiante ya está en progreso."
    );
  }

  const profile = await prisma.studentProfile.update({
    where: { id: studentProfileId },
    data: {
      advisorId: advisorId || null,
      organizationId: organizationId || null,
    },
  });

  if (advisorId) {
    await notify(
      advisorId,
      "Se te asignó un nuevo estudiante para seguimiento.",
      "/dashboard"
    );
  }
  await notify(
    profile.userId,
    "Tu asignación de asesor/organización fue actualizada.",
    "/dashboard"
  );

  revalidatePath("/dashboard");
}

// ---------- Administración (usuarios, organizaciones, expedientes) ----------

export async function createUser(formData: FormData) {
  const session = await requireSession();
  if (!([ROLES.ADMIN, ROLES.COORDINATION] as Role[]).includes(session.role)) {
    throw new Error("No autorizado.");
  }

  const { hashPassword } = await import("@/lib/auth");

  const name = String(formData.get("name"));
  const email = String(formData.get("email"));
  const password = String(formData.get("password"));
  const role = String(formData.get("role"));

  if (!name || !email || !password || !role) {
    throw new Error("Todos los campos son requeridos.");
  }

  await prisma.user.create({
    data: {
      name,
      email,
      role,
      passwordHash: await hashPassword(password),
    },
  });

  revalidatePath("/dashboard");
}

export async function createOrganization(formData: FormData) {
  const session = await requireSession();
  if (!([ROLES.ADMIN, ROLES.COORDINATION] as Role[]).includes(session.role)) {
    throw new Error("No autorizado.");
  }

  const name = String(formData.get("name"));
  const description = String(formData.get("description") ?? "");
  const contactUserId = String(formData.get("contactUserId") ?? "");

  if (!name) throw new Error("El nombre de la organización es requerido.");

  await prisma.organization.create({
    data: {
      name,
      description,
      contactUserId: contactUserId || null,
    },
  });

  revalidatePath("/dashboard");
}

export async function createStudentProfile(formData: FormData) {
  const session = await requireSession();
  if (!([ROLES.ADMIN, ROLES.COORDINATION] as Role[]).includes(session.role)) {
    throw new Error("No autorizado.");
  }

  const userId = String(formData.get("userId"));
  const studentCode = String(formData.get("studentCode"));
  const career = String(formData.get("career"));
  const processType = String(formData.get("processType"));
  const requiredHours = Number(formData.get("requiredHours") ?? 150);

  if (!userId || !studentCode || !career || !processType) {
    throw new Error("Todos los campos son requeridos.");
  }

  await prisma.studentProfile.create({
    data: {
      userId,
      studentCode,
      career,
      processType,
      requiredHours,
    },
  });

  revalidatePath("/dashboard");
}

// ---------- Perfil personal (cualquier rol) ----------

export async function updateProfile(formData: FormData) {
  const session = await requireSession();

  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) throw new Error("El nombre no puede estar vacío.");

  await prisma.user.update({
    where: { id: session.userId },
    data: { name, phone: phone || null },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile");
}

export async function changePassword(formData: FormData) {
  const session = await requireSession();
  const { hashPassword, verifyPassword } = await import("@/lib/auth");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");

  if (!currentPassword || !newPassword) {
    throw new Error("La contraseña actual y la nueva son requeridas.");
  }
  if (newPassword.length < 6) {
    throw new Error("La nueva contraseña debe tener al menos 6 caracteres.");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.userId },
  });

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) throw new Error("La contraseña actual no es correcta.");

  await prisma.user.update({
    where: { id: session.userId },
    data: { passwordHash: await hashPassword(newPassword) },
  });

  revalidatePath("/dashboard/profile");
}

// ---------- Notificaciones ----------

export async function markNotificationRead(formData: FormData) {
  const session = await requireSession();
  const notificationId = String(formData.get("notificationId"));

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.userId },
    data: { read: true },
  });

  revalidatePath("/dashboard");
}
