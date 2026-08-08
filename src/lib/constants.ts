export const ROLES = {
  STUDENT: "STUDENT",
  ADVISOR: "ADVISOR",
  COORDINATION: "COORDINATION",
  ORGANIZATION: "ORGANIZATION",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Estudiante",
  ADVISOR: "Profesor asesor",
  COORDINATION: "Coordinación de carrera",
  ORGANIZATION: "Organización externa",
  ADMIN: "Administrador",
};

export const PROCESS_TYPES = {
  PRACTICE: "PRACTICE",
  TCU: "TCU",
} as const;

export type ProcessType = (typeof PROCESS_TYPES)[keyof typeof PROCESS_TYPES];

export const PROCESS_TYPE_LABELS: Record<ProcessType, string> = {
  PRACTICE: "Práctica profesional",
  TCU: "Trabajo Comunal Universitario",
};

export const PROCESS_STATUSES = {
  NOT_STARTED: "NOT_STARTED",
  IN_PROGRESS: "IN_PROGRESS",
  HOURS_COMPLETED: "HOURS_COMPLETED",
  DELIVERABLES_PENDING: "DELIVERABLES_PENDING",
  COMPLETED: "COMPLETED",
} as const;

export type ProcessStatus =
  (typeof PROCESS_STATUSES)[keyof typeof PROCESS_STATUSES];

export const PROCESS_STATUS_LABELS: Record<ProcessStatus, string> = {
  NOT_STARTED: "Sin iniciar",
  IN_PROGRESS: "En progreso",
  HOURS_COMPLETED: "Horas completadas",
  DELIVERABLES_PENDING: "Entregables pendientes",
  COMPLETED: "Completado",
};

export const HOURS_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type HoursStatus = (typeof HOURS_STATUSES)[keyof typeof HOURS_STATUSES];

export const HOURS_STATUS_LABELS: Record<HoursStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export const DELIVERABLE_STATUSES = {
  PENDING: "PENDING",
  IN_REVIEW: "IN_REVIEW",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
} as const;

export type DeliverableStatus =
  (typeof DELIVERABLE_STATUSES)[keyof typeof DELIVERABLE_STATUSES];

export const DELIVERABLE_STATUS_LABELS: Record<DeliverableStatus, string> = {
  PENDING: "Pendiente",
  IN_REVIEW: "En revisión",
  APPROVED: "Aprobado",
  REJECTED: "Rechazado",
};
