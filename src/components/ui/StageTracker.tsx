import { PROCESS_STATUSES, PROCESS_STATUS_LABELS, type ProcessStatus } from "@/lib/constants";

const STAGE_ORDER: ProcessStatus[] = [
  PROCESS_STATUSES.NOT_STARTED,
  PROCESS_STATUSES.IN_PROGRESS,
  PROCESS_STATUSES.HOURS_COMPLETED,
  PROCESS_STATUSES.DELIVERABLES_PENDING,
  PROCESS_STATUSES.COMPLETED,
];

// El elemento central de la app: dónde va un estudiante en su recorrido.
// Es un stepper real (no decorativo) porque el proceso académico sí es
// una secuencia fija de 5 etapas que Coordinación y el asesor necesitan
// ubicar de un vistazo.
export default function StageTracker({ status }: { status: string }) {
  const currentIndex = Math.max(
    0,
    STAGE_ORDER.indexOf(status as ProcessStatus)
  );

  return (
    <ol className="flex items-start w-full" aria-label="Etapas del proceso">
      {STAGE_ORDER.map((stage, i) => {
        const done = i < currentIndex;
        const current = i === currentIndex;
        const future = i > currentIndex;
        return (
          <li key={stage} className="flex-1 flex flex-col items-center text-center min-w-0">
            <div className="flex items-center w-full">
              <div
                className="flex-1 h-px"
                style={{
                  backgroundColor: i === 0 ? "transparent" : done || current ? "var(--accent)" : "var(--border)",
                }}
              />
              <span
                aria-current={current ? "step" : undefined}
                className="shrink-0 w-2.5 h-2.5 rounded-full border-2 mx-0.5"
                style={{
                  backgroundColor: done ? "var(--accent)" : "var(--surface)",
                  borderColor: done || current ? "var(--accent)" : "var(--border)",
                  boxShadow: current ? "0 0 0 3px var(--accent-soft)" : "none",
                }}
              />
              <div
                className="flex-1 h-px"
                style={{
                  backgroundColor:
                    i === STAGE_ORDER.length - 1 ? "transparent" : done ? "var(--accent)" : "var(--border)",
                }}
              />
            </div>
            <span
              className="mt-1.5 text-[11px] leading-tight px-1"
              style={{
                color: current ? "var(--accent)" : future ? "var(--muted)" : "var(--foreground)",
                fontWeight: current ? 600 : 500,
                opacity: future ? 0.6 : 1,
              }}
            >
              {PROCESS_STATUS_LABELS[stage]}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
