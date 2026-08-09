"use client";

import { useEffect, useState } from "react";

export default function ProgressBar({
  percent,
  label,
}: {
  percent: number;
  label: string;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    // Arranca en 0 y crece hacia el valor real en el siguiente frame, para
    // que la transición CSS anime el llenado en vez de aparecer de golpe.
    const id = requestAnimationFrame(() => setWidth(percent));
    return () => cancelAnimationFrame(id);
  }, [percent]);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full h-2 bg-slate-100 rounded-full mt-1 overflow-hidden"
    >
      <div
        className="h-2 bg-slate-900 rounded-full transition-[width] duration-700 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
