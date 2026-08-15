"use client";

import { useActionState, useEffect, useState } from "react";
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

type FormState = { status: "idle" | "error" | "success"; message: string | null };

const initialState: FormState = { status: "idle", message: null };

// assignStudent (server action) lanza en vez de devolver un resultado; acá
// se atrapa ese error para poder mostrarlo dentro del formulario en vez de
// dejar que reviente hasta el error boundary de la ruta.
async function submitAssignment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  try {
    await assignStudent(formData);
    return { status: "success", message: "Asignación actualizada." };
  } catch (e) {
    return {
      status: "error",
      message: e instanceof Error ? e.message : "Ocurrió un error inesperado.",
    };
  }
}

export default function AssignStudentForm({
  students,
  advisors,
  organizations,
}: {
  students: StudentOption[];
  advisors: AdvisorOption[];
  organizations: SimpleOption[];
}) {
  // Sin estudiante preseleccionado: obliga a elegir explícitamente en vez
  // de arrancar apuntando al primero de la lista (fácil de asignar por
  // error a quien no corresponde).
  const [selectedId, setSelectedId] = useState("");
  const [state, formAction, isPending] = useActionState(submitAssignment, initialState);

  useEffect(() => {
    // Tras un envío exitoso, vuelve a "No seleccionado" para forzar una
    // elección explícita en la siguiente asignación.
    if (state.status === "success") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reacciona al resultado de una acción async, no se puede calcular en el render
      setSelectedId("");
    }
  }, [state]);

  const selected = students.find((s) => s.id === selectedId);
  const orgLocked = !!selected && selected.status !== PROCESS_STATUSES.NOT_STARTED;
  const currentOrgName =
    organizations.find((o) => o.id === selected?.organizationId)?.name ?? "Sin asignar";

  // Un asesor solo atiende un tipo de proceso: solo se ofrecen los que
  // coinciden con el proceso del estudiante seleccionado.
  const matchingAdvisors = advisors.filter((a) => a.processType === selected?.processType);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">Estudiante</label>
        <select
          name="studentProfileId"
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm transition-colors"
        >
          <option value="" disabled>
            No seleccionado
          </option>
          {students.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Profesor asesor
          {selected && (
            <span className="text-slate-400">
              {" "}
              ({PROCESS_TYPE_LABELS[selected.processType as ProcessType]})
            </span>
          )}
        </label>
        <select
          key={selectedId}
          name="advisorId"
          disabled={!selected}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
        >
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
        <label className="block text-xs font-medium text-slate-500 mb-1">
          Organización
          {orgLocked && <span className="text-amber-600"> — proceso en curso, no editable</span>}
        </label>
        {orgLocked ? (
          <>
            <select
              disabled
              value={currentOrgName}
              className="border border-slate-200 bg-slate-100 text-slate-400 rounded-lg px-3 py-2 text-sm cursor-not-allowed"
            >
              <option>{currentOrgName}</option>
            </select>
            <input type="hidden" name="organizationId" value={selected?.organizationId ?? ""} />
          </>
        ) : (
          <select
            key={selectedId}
            name="organizationId"
            disabled={!selected}
            defaultValue={selected?.organizationId ?? ""}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm transition-colors disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
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

      <button
        disabled={!selected || isPending}
        className="bg-slate-900 text-white text-sm font-medium rounded-lg px-4 py-2 hover:bg-slate-800 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
      >
        {isPending ? "Asignando…" : "Asignar"}
      </button>

      {state.status === "error" && (
        <p className="w-full text-sm text-red-600" role="alert">
          {state.message}
        </p>
      )}
      {state.status === "success" && (
        <p className="w-full text-sm text-emerald-600">{state.message}</p>
      )}
    </form>
  );
}
