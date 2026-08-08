"use client";

import { useState } from "react";
import { assignStudent } from "@/lib/actions";
import { PROCESS_STATUSES } from "@/lib/constants";

type StudentOption = {
  id: string;
  name: string;
  status: string;
  organizationId: string | null;
};

type SimpleOption = { id: string; name: string };

export default function AssignStudentForm({
  students,
  advisors,
  organizations,
}: {
  students: StudentOption[];
  advisors: SimpleOption[];
  organizations: SimpleOption[];
}) {
  const [selectedId, setSelectedId] = useState(students[0]?.id ?? "");
  const selected = students.find((s) => s.id === selectedId);
  const orgLocked = !!selected && selected.status !== PROCESS_STATUSES.NOT_STARTED;
  const currentOrgName =
    organizations.find((o) => o.id === selected?.organizationId)?.name ?? "Sin asignar";

  return (
    <form action={assignStudent} className="flex flex-wrap items-end gap-3">
      <div>
        <label className="block text-xs text-slate-500">Estudiante</label>
        <select
          name="studentProfileId"
          required
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
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
        <label className="block text-xs text-slate-500">Profesor asesor</label>
        <select name="advisorId" className="border border-slate-300 rounded-md px-2 py-1.5 text-sm">
          <option value="">Sin asignar</option>
          {advisors.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
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
