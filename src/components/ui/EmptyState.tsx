import Icon, { type IconName } from "./Icon";

export default function EmptyState({
  icon = "inbox",
  title,
  description,
}: {
  icon?: IconName;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-4">
      <div className="w-11 h-11 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center mb-3">
        <Icon name={icon} className="w-5 h-5" />
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {description && (
        <p className="text-xs text-slate-400 mt-1 max-w-xs">{description}</p>
      )}
    </div>
  );
}
