"use client";

import { useEffect, useState } from "react";
import { assignStudent } from "@/lib/actions";
import { PROCESS_STATUSES, PROCESS_TYPE_LABELS, type ProcessType } from "@/lib/constants";

type StudentOption = {
  id: string;
  name: string;
  status: string;
  organizationId: string | null;
  processType: string;
};

type AdvisorOption = { id: string; name: string; processType: string | null };
type SimpleOption = { id: string; name: string };

// Al asignar, el servidor revalida /dashboard y el formulario se vuelve a
// montar con sus valores por defecto (el primer estudiante de la lista),
// no necesariamente el que se acababa de editar. Se guarda la última
// selección en sessionStorage para restaurarla apenas el formulario vuelve
// a aparecer, en vez de "saltar" a otro estudiante.
const STORAGE_KEY = "smart-app:assign-student-selected-id";

export default function AssignStudentForm({
  students,
  advisors,
  organizations,
}: {
  students: StudentOption[];
  advisors: AdvisorOption[];
  organizations: SimpleOption[];
}) {
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");

  useEffect(() => {
    // Se sincroniza después del montaje (no en el valor inicial de useState)
    // para no leer sessionStorage durante el render en el servidor, lo que
    // rompería la hidratación si el valor guardado difiere del default SSR.
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored && students.some((s) => s.id === stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza con sessionStorage tras el montaje, no puede calcularse en el render
      setSelectedId(stored);
    }
  }, [students]);

  function selectStudent(id: string) {
    setSelectedId(id);
    sessionStorage.setItem(STORAGE_KEY, id);
  }

  const selected = students.find((s) => s.id === selectedId);
  const orgLocked = !!selected && selected.status !== PROCESS_STATUSES.NOT_STARTED;
  const currentOrgName =
    organizations.find((o) => o.id === selected?.organizationId)?.name ?? "Sin asignar";

  // Un asesor solo atiende un tipo de proceso: solo se ofrecen los que
  // coinciden con el proceso del estudiante seleccionado.
  const matchingAdvisors = advisors.filter((a) => a.processType === selected?.processType);

  return (
    <form action={assignStudent} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-slate-500">Estudiante</label>
        <select
          name="studentProfileId"
          required
          value={selectedId}
          onChange={(e) => selectStudent(e.target.value)}
          className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
        >
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs text-slate-500">
          Profesor asesor
          {selected && (
            <span className="text-slate-400">
              {" "}
              ({PROCESS_TYPE_LABELS[selected.processType as ProcessType]})
            </span>
          )}
        </label>
        <select key={selectedId} name="advisorId" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
          <option value="">Sin asignar</option>
          {matchingAdvisors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
        {selected && matchingAdvisors.length === 0 && (
          <p className="text-xs text-amber-600 mt-1">
            No hay asesores registrados para {PROCESS_TYPE_LABELS[selected.processType as ProcessType]}.
          </p>
        )}
      </div>

      <div>
        <label className="block text-xs text-slate-500">
          Organización
          {orgLocked && <span className="text-amber-600"> — proceso en curso, no editable</span>}
        </label>
        {orgLocked ? (
          <>
            <select
              disabled
              value={currentOrgName}
              className="border border-slate-200 bg-slate-100 text-slate-400 rounded-md px-2 py-1.5 text-sm cursor-not-allowed"
            >
              <option>{currentOrgName}</option>
            </select>
            <input type="hidden" name="organizationId" value={selected?.organizationId ?? ""} />
          </>
        ) : (
          <select
            key={selectedId}
            name="organizationId"
            defaultValue={selected?.organizationId ?? ""}
            className="border border-slate-300 rounded-md px-2 py-1.5 text-sm"
          >
            <option value="">Sin asignar</option>
            {organizations.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <button className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800">
        Asignar
      </button>
    </form>
  );
}
