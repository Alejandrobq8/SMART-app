"use client";

import { useEffect } from "react";

export default function ConfirmModal({
  title,
  body,
  confirmLabel = "Confirmar",
  tone = "neutral",
  onConfirm,
  onCancel,
}: {
  title: string;
  body: string;
  confirmLabel?: string;
  tone?: "approve" | "reject" | "neutral";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCancel]);

  const confirmTone =
    tone === "approve"
      ? "bg-emerald-600 hover:bg-emerald-700"
      : tone === "reject"
        ? "bg-red-600 hover:bg-red-700"
        : "bg-slate-900 hover:bg-slate-800";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] px-4 animate-[fadeIn_150ms_ease-out]"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        aria-describedby="confirm-modal-body"
        className="w-full max-w-sm bg-white rounded-xl border border-slate-200 shadow-lg p-6 transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="confirm-modal-title" className="text-sm font-semibold text-slate-900">
          {title}
        </h3>
        <p id="confirm-modal-body" className="text-sm text-slate-500 mt-2">
          {body}
        </p>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            autoFocus
            onClick={onConfirm}
            className={`text-sm px-3 py-1.5 rounded-md text-white ${confirmTone}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
