// Agregaciones puras (sin Prisma) para poder testearlas sin base de datos
// ni renderizar page.tsx. Reciben solo los campos que necesitan.

export type ReportableProfile = {
  career: string;
  period: string | null;
  status: string;
  processType: string;
};

export function countByKey<T extends ReportableProfile>(
  profiles: T[],
  key: "career" | "period" | "processType"
): Record<string, number> {
  return profiles.reduce<Record<string, number>>((acc, p) => {
    const value = p[key] ?? "Sin periodo";
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}

export function filterProfiles<T extends ReportableProfile>(
  profiles: T[],
  filters: { career?: string; period?: string; processType?: string }
): T[] {
  return profiles.filter((p) => {
    if (filters.career && p.career !== filters.career) return false;
    if (filters.period && (p.period ?? "") !== filters.period) return false;
    if (filters.processType && p.processType !== filters.processType) return false;
    return true;
  });
}

export function distinctValues<T extends ReportableProfile>(
  profiles: T[],
  key: "career" | "period"
): string[] {
  const set = new Set<string>();
  for (const p of profiles) {
    const value = p[key];
    if (value) set.add(value);
  }
  return Array.from(set).sort();
}
