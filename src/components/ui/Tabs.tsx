"use client";

import { useState, type ReactNode } from "react";
import Icon, { type IconName } from "./Icon";

export type TabItem = {
  id: string;
  label: string;
  icon?: IconName;
  badge?: number;
  content: ReactNode;
};

export default function Tabs({ tabs }: { tabs: TabItem[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Secciones"
        className="flex flex-wrap gap-1 mb-6 -mt-1"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(t.id)}
              className="relative flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium transition-colors hover:opacity-75"
              style={{ color: isActive ? "var(--accent)" : "var(--muted)" }}
            >
              {t.icon && <Icon name={t.icon} className="w-4 h-4" />}
              {t.label}
              {typeof t.badge === "number" && t.badge > 0 && (
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[1.15rem] h-[1.15rem] px-1 rounded-full text-[10px] font-semibold bg-[var(--status-pending-bg)] text-[var(--status-pending)] border border-[var(--status-pending-border)]">
                  {t.badge}
                </span>
              )}
              {isActive && (
                <span className="absolute left-0 right-0 -bottom-px h-0.5 rounded-full bg-[var(--accent)]" />
              )}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div
          key={t.id}
          role="tabpanel"
          hidden={active !== t.id}
          className={active === t.id ? "animate-enter space-y-6" : "space-y-6"}
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}
