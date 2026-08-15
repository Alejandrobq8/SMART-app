"use client";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-6 max-w-lg">
      <h2 className="text-base font-semibold text-red-700 mb-2">
        No se pudo completar la acción
      </h2>
      <p className="text-sm text-slate-600 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="bg-slate-900 text-white text-sm rounded-md px-4 py-1.5 hover:bg-slate-800"
      >
        Reintentar
      </button>
    </div>
  );
}
