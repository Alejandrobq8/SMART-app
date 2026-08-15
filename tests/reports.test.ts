import { describe, expect, it } from "vitest";
import {
  countByKey,
  distinctValues,
  filterProfiles,
  type ReportableProfile,
} from "@/lib/reports";

const profiles: ReportableProfile[] = [
  { career: "Ingeniería en Sistemas", period: "2026-1", status: "IN_PROGRESS", processType: "TCU" },
  { career: "Ingeniería en Sistemas", period: "2026-1", status: "COMPLETED", processType: "PRACTICE" },
  { career: "Administración de Negocios", period: "2026-1", status: "NOT_STARTED", processType: "TCU" },
  { career: "Administración de Negocios", period: null, status: "IN_PROGRESS", processType: "PRACTICE" },
];

describe("countByKey", () => {
  it("agrupa por carrera", () => {
    expect(countByKey(profiles, "career")).toEqual({
      "Ingeniería en Sistemas": 2,
      "Administración de Negocios": 2,
    });
  });

  it("agrupa por periodo, tratando null como 'Sin periodo'", () => {
    expect(countByKey(profiles, "period")).toEqual({
      "2026-1": 3,
      "Sin periodo": 1,
    });
  });
});

describe("filterProfiles", () => {
  it("filtra por carrera", () => {
    const result = filterProfiles(profiles, { career: "Ingeniería en Sistemas" });
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.career === "Ingeniería en Sistemas")).toBe(true);
  });

  it("filtra por periodo", () => {
    const result = filterProfiles(profiles, { period: "2026-1" });
    expect(result).toHaveLength(3);
  });

  it("combina carrera y periodo", () => {
    const result = filterProfiles(profiles, {
      career: "Administración de Negocios",
      period: "2026-1",
    });
    expect(result).toHaveLength(1);
  });

  it("sin filtros devuelve todo", () => {
    expect(filterProfiles(profiles, {})).toHaveLength(4);
  });

  it("filtra por tipo de proceso", () => {
    const result = filterProfiles(profiles, { processType: "TCU" });
    expect(result).toHaveLength(2);
    expect(result.every((p) => p.processType === "TCU")).toBe(true);
  });
});

describe("countByKey — por tipo de proceso", () => {
  it("agrupa por tipo de proceso", () => {
    expect(countByKey(profiles, "processType")).toEqual({
      TCU: 2,
      PRACTICE: 2,
    });
  });
});

describe("distinctValues", () => {
  it("devuelve carreras únicas y ordenadas", () => {
    expect(distinctValues(profiles, "career")).toEqual([
      "Administración de Negocios",
      "Ingeniería en Sistemas",
    ]);
  });

  it("ignora periodos nulos", () => {
    expect(distinctValues(profiles, "period")).toEqual(["2026-1"]);
  });
});
