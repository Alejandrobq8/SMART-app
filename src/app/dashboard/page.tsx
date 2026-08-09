import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  DELIVERABLE_STATUS_LABELS,
  HOURS_STATUS_LABELS,
  PROCESS_STATUS_LABELS,
  PROCESS_TYPE_LABELS,
  ROLE_LABELS,
  ROLES,
  type DeliverableStatus,
  type HoursStatus,
  type ProcessStatus,
  type ProcessType,
  type Role,
} from "@/lib/constants";
import {
  createOrganization,
  createStudentProfile,
  createUser,
  logHours,
  markNotificationRead,
  reviewDeliverable,
  reviewHours,
  submitDeliverable,
} from "@/lib/actions";
import AssignStudentForm from "./assign-student-form";
import { studentSelectorEmptyMessage } from "@/lib/ui-copy";
import { runOverdueReminders } from "@/lib/reminders";
import { countByKey, distinctValues, filterProfiles } from "@/lib/reports";
import ProgressBar from "@/components/ui/ProgressBar";
import EmptyState from "@/components/ui/EmptyState";
import ReviewRow from "@/components/ui/ReviewRow";

function StatusBadge({ label, tone }: { label: string; tone: "green" | "yellow" | "red" | "gray" }) {
  const tones: Record<string, string> = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    red: "bg-red-50 text-red-700 border-red-200",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${tones[tone]}`}>
      {label}
    </span>
  );
}

function hoursTone(status: string) {
  if (status === "APPROVED") return "green" as const;
  if (status === "REJECTED") return "red" as const;
  return "yellow" as const;
}

function deliverableTone(status: string) {
  if (status === "APPROVED") return "green" as const;
  if (status === "REJECTED") return "red" as const;
  if (status === "IN_REVIEW") return "yellow" as const;
  return "gray" as const;
}

function processTone(status: string) {
  if (status === "COMPLETED") return "green" as const;
  if (status === "NOT_STARTED") return "gray" as const;
  return "yellow" as const;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6">
      <h2 className="text-base font-semibold text-slate-900 mb-4">{title}</h2>
      {children}
    </section>
  );
}

function NotificationsPanel({
  notifications,
}: {
  notifications: { id: string; message: string; read: boolean; createdAt: Date }[];
}) {
  if (notifications.length === 0) {
    return <p className="text-sm text-slate-400">Sin notificaciones.</p>;
  }
  return (
    <ul className="space-y-2">
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`text-sm p-3 rounded-md border flex items-center justify-between gap-3 ${
            n.read ? "border-slate-100 text-slate-400" : "border-slate-200 text-slate-800 bg-slate-50"
          }`}
        >
          <span>{n.message}</span>
          {!n.read && (
            <form action={markNotificationRead}>
              <input type="hidden" name="notificationId" value={n.id} />
              <button className="text-xs text-slate-500 hover:text-slate-900 whitespace-nowrap">
                Marcar leída
              </button>
            </form>
          )}
        </li>
      ))}
    </ul>
  );
}

// ---------------- STUDENT ----------------

async function StudentDashboard({ userId }: { userId: string }) {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    include: {
      advisor: true,
      organization: true,
      hoursLogs: { orderBy: { date: "desc" } },
      deliverables: { orderBy: { submittedAt: "desc" } },
    },
  });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  if (!profile) {
    return (
      <Card title="Expediente">
        <p className="text-sm text-slate-500">
          Aún no tienes un expediente de práctica/TCU. Contacta a la coordinación de carrera.
        </p>
      </Card>
    );
  }

  const approvedHours = profile.hoursLogs
    .filter((h) => h.status === "APPROVED")
    .reduce((s, h) => s + h.hours, 0);
  const progressPct = Math.min(100, Math.round((approvedHours / profile.requiredHours) * 100));

  return (
    <div className="space-y-6">
      <Card title="Mi expediente">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Carné</p>
            <p className="font-medium text-slate-900">{profile.studentCode}</p>
          </div>
          <div>
            <p className="text-slate-400">Carrera</p>
            <p className="font-medium text-slate-900">{profile.career}</p>
          </div>
          <div>
            <p className="text-slate-400">Proceso</p>
            <p className="font-medium text-slate-900">
              {PROCESS_TYPE_LABELS[profile.processType as ProcessType]}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Estado</p>
            <StatusBadge
              label={PROCESS_STATUS_LABELS[profile.status as ProcessStatus]}
              tone={processTone(profile.status)}
            />
          </div>
          <div>
            <p className="text-slate-400">Profesor asesor</p>
            <p className="font-medium text-slate-900">{profile.advisor?.name ?? "Sin asignar"}</p>
          </div>
          <div>
            <p className="text-slate-400">Organización</p>
            <p className="font-medium text-slate-900">{profile.organization?.name ?? "Sin asignar"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-slate-400">Horas aprobadas / requeridas</p>
            <p className="font-medium text-slate-900">
              {approvedHours} / {profile.requiredHours} h
            </p>
            <ProgressBar
              percent={progressPct}
              label={`Horas aprobadas: ${approvedHours} de ${profile.requiredHours}`}
            />
          </div>
        </div>
      </Card>

      <Card title="Registrar horas">
        {profile.status === "COMPLETED" ? (
          <p className="text-sm text-slate-500">
            Tu proceso ya fue completado y aprobado por tu asesor. No se pueden registrar más horas.
          </p>
        ) : (
          <form action={logHours} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500">Fecha</label>
              <input type="date" name="date" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Horas</label>
              <input type="number" step="0.5" min="0.5" name="hours" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-24" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-slate-500">Descripción</label>
              <input type="text" name="description" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-full" placeholder="Actividad realizada" />
            </div>
            <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
              Registrar
            </button>
          </form>
        )}

        <table className="w-full text-sm mt-5">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2">Fecha</th>
              <th>Horas</th>
              <th>Descripción</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {profile.hoursLogs.map((h) => (
              <tr key={h.id} className="border-b border-slate-50">
                <td className="py-2">{h.date.toLocaleDateString("es-CR")}</td>
                <td>{h.hours}</td>
                <td className="text-slate-600">{h.description}</td>
                <td>
                  <StatusBadge label={HOURS_STATUS_LABELS[h.status as HoursStatus]} tone={hoursTone(h.status)} />
                </td>
              </tr>
            ))}
            {profile.hoursLogs.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  Aún no hay horas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Entregables">
        {profile.status === "COMPLETED" ? (
          <p className="text-sm text-slate-500">
            Tu proceso ya fue completado y aprobado por tu asesor. No se pueden enviar más entregables.
          </p>
        ) : (
          <form action={submitDeliverable} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-slate-500">Título</label>
              <input type="text" name="title" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-full" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="block text-xs text-slate-500">Descripción</label>
              <input type="text" name="description" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-full" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Archivo (nombre)</label>
              <input type="text" name="fileName" placeholder="informe.pdf" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
            </div>
            <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
              Enviar
            </button>
          </form>
        )}

        <table className="w-full text-sm mt-5">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2">Título</th>
              <th>Archivo</th>
              <th>Estado</th>
              <th>Comentario</th>
            </tr>
          </thead>
          <tbody>
            {profile.deliverables.map((d) => (
              <tr key={d.id} className="border-b border-slate-50">
                <td className="py-2">{d.title}</td>
                <td className="text-slate-600">{d.fileName ?? "—"}</td>
                <td>
                  <StatusBadge
                    label={DELIVERABLE_STATUS_LABELS[d.status as DeliverableStatus]}
                    tone={deliverableTone(d.status)}
                  />
                </td>
                <td className="text-slate-500">{d.comment ?? "—"}</td>
              </tr>
            ))}
            {profile.deliverables.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-slate-400">
                  Aún no hay entregables.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Notificaciones">
        <NotificationsPanel notifications={notifications} />
      </Card>
    </div>
  );
}

// ---------------- ADVISOR / ORGANIZATION (review) ----------------

async function ReviewerDashboard({ userId, role }: { userId: string; role: Role }) {
  try {
    await runOverdueReminders();
  } catch {
    // Un fallo generando recordatorios no debe romper el dashboard.
  }

  const where =
    role === ROLES.ADVISOR
      ? { advisorId: userId }
      : { organizationId: (await prisma.organization.findUnique({ where: { contactUserId: userId } }))?.id ?? "__none__" };

  const students = await prisma.studentProfile.findMany({
    where,
    include: { user: true, hoursLogs: true, deliverables: true },
  });

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const pendingHours = students.flatMap((s) =>
    s.hoursLogs
      .filter((h) => h.status === "PENDING")
      .map((h) => ({ ...h, studentName: s.user.name }))
  );

  const pendingDeliverables = students.flatMap((s) =>
    s.deliverables
      .filter((d) => d.status === "PENDING" || d.status === "IN_REVIEW")
      .map((d) => ({ ...d, studentName: s.user.name }))
  );

  return (
    <div className="space-y-6">
      <Card title="Estudiantes a cargo">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2">Estudiante</th>
              <th>Carrera</th>
              <th>Proceso</th>
              <th>Estado</th>
              <th>Horas aprobadas</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const approved = s.hoursLogs.filter((h) => h.status === "APPROVED").reduce((a, h) => a + h.hours, 0);
              return (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="py-2">{s.user.name}</td>
                  <td>{s.career}</td>
                  <td>{PROCESS_TYPE_LABELS[s.processType as ProcessType]}</td>
                  <td>
                    <StatusBadge label={PROCESS_STATUS_LABELS[s.status as ProcessStatus]} tone={processTone(s.status)} />
                  </td>
                  <td>{approved} / {s.requiredHours} h</td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={5} className="py-4 text-center text-slate-400">
                  No tienes estudiantes asignados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Horas pendientes de aprobación">
        <div className="space-y-3">
          {pendingHours.map((h) => (
            <ReviewRow
              key={h.id}
              action={reviewHours}
              hiddenFields={{ hoursLogId: h.id }}
              studentName={h.studentName}
              summary={`${h.hours} h — ${h.description} (${h.date.toLocaleDateString("es-CR")})`}
              decisions={[
                {
                  value: "APPROVED",
                  label: "Aprobar",
                  tone: "approve",
                  confirmTitle: "¿Aprobar estas horas?",
                  confirmBody: `Se aprobarán ${h.hours} h reportadas por ${h.studentName}. Esta acción notificará al estudiante y sumará las horas a su progreso.`,
                },
                {
                  value: "REJECTED",
                  label: "Rechazar",
                  tone: "reject",
                  confirmTitle: "¿Rechazar estas horas?",
                  confirmBody: `Se rechazará el registro de ${h.hours} h de ${h.studentName}. Se le notificará el rechazo.`,
                },
              ]}
            />
          ))}
          {pendingHours.length === 0 && (
            <EmptyState
              icon="✅"
              title="No hay horas pendientes"
              description="Cuando un estudiante a tu cargo registre horas, aparecerán acá para tu aprobación."
            />
          )}
        </div>
      </Card>

      <Card title="Entregables pendientes de revisión">
        <div className="space-y-3">
          {pendingDeliverables.map((d) => (
            <ReviewRow
              key={d.id}
              action={reviewDeliverable}
              hiddenFields={{ deliverableId: d.id }}
              studentName={d.studentName}
              summary={d.title}
              decisions={[
                {
                  value: "APPROVED",
                  label: "Aprobar",
                  tone: "approve",
                  confirmTitle: "¿Aprobar este entregable?",
                  confirmBody: `Se aprobará "${d.title}" de ${d.studentName}.`,
                },
                {
                  value: "IN_REVIEW",
                  label: "En revisión",
                  tone: "neutral",
                  confirmTitle: "¿Marcar como en revisión?",
                  confirmBody: `Se marcará "${d.title}" como en revisión, indicando que falta algo por corregir.`,
                },
                {
                  value: "REJECTED",
                  label: "Rechazar",
                  tone: "reject",
                  confirmTitle: "¿Rechazar este entregable?",
                  confirmBody: `Se rechazará "${d.title}" de ${d.studentName}.`,
                },
              ]}
            />
          ))}
          {pendingDeliverables.length === 0 && (
            <EmptyState
              icon="✅"
              title="No hay entregables pendientes"
              description="Los entregables que suban tus estudiantes a cargo aparecerán acá para tu revisión."
            />
          )}
        </div>
      </Card>

      <Card title="Notificaciones">
        <NotificationsPanel notifications={notifications} />
      </Card>
    </div>
  );
}

// ---------------- COORDINATION / ADMIN ----------------

async function CoordinationDashboard({
  userId,
  role,
  searchParams,
}: {
  userId: string;
  role: Role;
  searchParams: { career?: string; period?: string };
}) {
  try {
    await runOverdueReminders();
  } catch {
    // Un fallo generando recordatorios no debe romper el dashboard.
  }

  const [allStudents, advisors, organizations, usersWithoutProfile, notifications] = await Promise.all([
    prisma.studentProfile.findMany({
      include: { user: true, advisor: true, organization: true, hoursLogs: true, deliverables: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findMany({ where: { role: ROLES.ADVISOR } }),
    prisma.organization.findMany(),
    prisma.user.findMany({ where: { role: ROLES.STUDENT, studentProfile: null } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  const careerFilter = searchParams.career ?? "";
  const periodFilter = searchParams.period ?? "";
  const students = filterProfiles(allStudents, {
    career: careerFilter || undefined,
    period: periodFilter || undefined,
  });

  const statusCounts = students.reduce<Record<string, number>>((acc, s) => {
    acc[s.status] = (acc[s.status] ?? 0) + 1;
    return acc;
  }, {});
  const careerCounts = countByKey(allStudents, "career");
  const periodCounts = countByKey(allStudents, "period");
  const careerOptions = distinctValues(allStudents, "career");
  const periodOptions = distinctValues(allStudents, "period");

  return (
    <div className="space-y-6">
      <Card title="Tablero general — estado de estudiantes">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {Object.entries(PROCESS_STATUS_LABELS).map(([key, label]) => (
            <div key={key} className="border border-slate-100 rounded-md p-3 text-center">
              <p className="text-2xl font-semibold text-slate-900">{statusCounts[key] ?? 0}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Por carrera</p>
            <ul className="text-sm space-y-1">
              {Object.entries(careerCounts).map(([career, count]) => (
                <li key={career} className="flex justify-between border-b border-slate-50 py-1">
                  <span className="text-slate-700">{career}</span>
                  <span className="text-slate-400">{count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2">Por periodo</p>
            <ul className="text-sm space-y-1">
              {Object.entries(periodCounts).map(([period, count]) => (
                <li key={period} className="flex justify-between border-b border-slate-50 py-1">
                  <span className="text-slate-700">{period}</span>
                  <span className="text-slate-400">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <form method="GET" className="flex flex-wrap items-end gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500">Filtrar por carrera</label>
            <select name="career" defaultValue={careerFilter} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
              <option value="">Todas</option>
              {careerOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Filtrar por periodo</label>
            <select name="period" defaultValue={periodFilter} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
              <option value="">Todos</option>
              {periodOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
            Filtrar
          </button>
          {(careerFilter || periodFilter) && (
            <a href="/dashboard" className="text-xs text-slate-500 underline">
              Limpiar filtros
            </a>
          )}
        </form>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-100">
              <th className="py-2">Estudiante</th>
              <th>Carrera</th>
              <th>Periodo</th>
              <th>Asesor</th>
              <th>Organización</th>
              <th>Estado</th>
              <th>Horas</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => {
              const approved = s.hoursLogs.filter((h) => h.status === "APPROVED").reduce((a, h) => a + h.hours, 0);
              return (
                <tr key={s.id} className="border-b border-slate-50">
                  <td className="py-2">{s.user.name}</td>
                  <td>{s.career}</td>
                  <td>{s.period ?? "—"}</td>
                  <td>{s.advisor?.name ?? "—"}</td>
                  <td>{s.organization?.name ?? "—"}</td>
                  <td>
                    <StatusBadge label={PROCESS_STATUS_LABELS[s.status as ProcessStatus]} tone={processTone(s.status)} />
                  </td>
                  <td>{approved} / {s.requiredHours} h</td>
                </tr>
              );
            })}
            {students.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 text-center text-slate-400">
                  No hay expedientes que coincidan con el filtro.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="Asignar asesor / organización a un estudiante">
        <AssignStudentForm
          students={allStudents.map((s) => ({
            id: s.id,
            name: s.user.name,
            status: s.status,
            organizationId: s.organizationId,
          }))}
          advisors={advisors.map((a) => ({ id: a.id, name: a.name }))}
          organizations={organizations.map((o) => ({ id: o.id, name: o.name }))}
        />
      </Card>

      <Card title="Crear expediente de estudiante">
        {studentSelectorEmptyMessage(usersWithoutProfile.length) ? (
          <p className="text-sm text-slate-500">
            {studentSelectorEmptyMessage(usersWithoutProfile.length)}
          </p>
        ) : (
          <form action={createStudentProfile} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500">Usuario (estudiante)</label>
              <select name="userId" required defaultValue="" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
                <option value="" disabled>
                  Selecciona un estudiante
                </option>
                {usersWithoutProfile.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500">Carné</label>
              <input type="text" name="studentCode" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-28" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Carrera</label>
              <input type="text" name="career" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Proceso</label>
              <select name="processType" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
                <option value="PRACTICE">Práctica profesional</option>
                <option value="TCU">TCU</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500">Periodo</label>
              <input type="text" name="period" placeholder="Ej. 2026-1" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-24" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Horas requeridas</label>
              <input type="number" name="requiredHours" defaultValue={150} className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-24" />
            </div>
            <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
              Crear
            </button>
          </form>
        )}
      </Card>

      <Card title="Organizaciones externas">
        <form action={createOrganization} className="flex flex-wrap items-end gap-3 mb-5">
          <div>
            <label className="block text-xs text-slate-500">Nombre</label>
            <input type="text" name="name" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs text-slate-500">Descripción</label>
            <input type="text" name="description" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm w-full" />
          </div>
          <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
            Crear organización
          </button>
        </form>
        <ul className="text-sm space-y-1">
          {organizations.map((o) => (
            <li key={o.id} className="text-slate-700">
              <span className="font-medium">{o.name}</span>
              {o.description && <span className="text-slate-400"> — {o.description}</span>}
            </li>
          ))}
        </ul>
      </Card>

      {role === ROLES.ADMIN && (
        <Card title="Administración de usuarios">
          <form action={createUser} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-slate-500">Nombre</label>
              <input type="text" name="name" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Correo</label>
              <input type="email" name="email" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Contraseña</label>
              <input type="text" name="password" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs text-slate-500">Rol</label>
              <select name="role" required className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
                {Object.entries(ROLE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
              Crear usuario
            </button>
          </form>
        </Card>
      )}

      <Card title="Notificaciones">
        <NotificationsPanel notifications={notifications} />
      </Card>
    </div>
  );
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ career?: string; period?: string }>;
}) {
  const session = await getSession();
  if (!session) return null;

  if (session.role === ROLES.STUDENT) {
    return <StudentDashboard userId={session.userId} />;
  }
  if (session.role === ROLES.ADVISOR || session.role === ROLES.ORGANIZATION) {
    return <ReviewerDashboard userId={session.userId} role={session.role as Role} />;
  }
  return (
    <CoordinationDashboard
      userId={session.userId}
      role={session.role as Role}
      searchParams={await searchParams}
    />
  );
}
