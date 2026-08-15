import { PROCESS_TYPE_LABELS, type ProcessType } from "@/lib/constants";

// Cada tipo de proceso tiene su propio acento (verde bosque para TCU,
// terracota para Práctica) para que se reconozca de un vistazo en tablas
// y tarjetas, sin tener que leer la etiqueta completa cada vez.
export default function ProcessTag({ type }: { type: ProcessType | string }) {
  const isTcu = type === "TCU";
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-medium"
      style={{ color: isTcu ? "var(--accent)" : "var(--clay)" }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: isTcu ? "var(--accent)" : "var(--clay)" }}
        aria-hidden="true"
      />
      {PROCESS_TYPE_LABELS[type as ProcessType] ?? type}
    </span>
  );
}
