"use client";

import { useRef, useState } from "react";
import ConfirmModal from "./ConfirmModal";

type Decision = {
  value: string;
  label: string;
  tone: "approve" | "reject" | "neutral";
  confirmTitle: string;
  confirmBody: string;
};

export default function ReviewRow({
  action,
  hiddenFields,
  studentName,
  summary,
  decisions,
}: {
  action: (formData: FormData) => void | Promise<void>;
  hiddenFields: Record<string, string>;
  studentName: string;
  summary: string;
  decisions: Decision[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState<Decision | null>(null);

  function handleConfirm() {
    if (!pending || !formRef.current) return;
    const formData = new FormData(formRef.current);
    formData.set("decision", pending.value);
    setPending(null);
    action(formData);
  }

  const toneClass = (tone: Decision["tone"]) =>
    tone === "approve"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : tone === "reject"
        ? "bg-red-600 hover:bg-red-700"
        : "bg-amber-500 hover:bg-amber-600";

  return (
    <>
      <form
        ref={formRef}
        className="flex flex-wrap items-center gap-3 text-sm rounded-lg p-3.5 transition-colors"
        style={{ border: "1px solid var(--border)", backgroundColor: "var(--surface)" }}
      >
        {Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}
        <span className="font-medium text-slate-900">{studentName}</span>
        <span className="text-slate-500">{summary}</span>
        <label className="sr-only" htmlFor={`comment-${hiddenFields.hoursLogId ?? hiddenFields.deliverableId}`}>
          Comentario (opcional)
        </label>
        <input
          id={`comment-${hiddenFields.hoursLogId ?? hiddenFields.deliverableId}`}
          type="text"
          name="comment"
          placeholder="Comentario (opcional)"
          className="border border-slate-300 rounded-md px-2 py-1 text-xs flex-1 min-w-[150px]"
        />
        {decisions.map((d) => (
          <button
            key={d.value}
            type="button"
            onClick={() => setPending(d)}
            className={`text-xs text-white rounded-md px-3 py-1 transition-colors ${toneClass(d.tone)}`}
          >
            {d.label}
          </button>
        ))}
      </form>

      {pending && (
        <ConfirmModal
          title={pending.confirmTitle}
          body={pending.confirmBody}
          confirmLabel={pending.label}
          tone={pending.tone}
          onConfirm={handleConfirm}
          onCancel={() => setPending(null)}
        />
      )}
    </>
  );
}
