type Option<T extends string> = {
  value: T;
  label: string;
  icon?: string;
};

type Props<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: readonly Option<T>[];
  label?: string;
};

export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  label,
}: Props<T>) {
  const currentIndex = options.findIndex((o) => o.value === value);

  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex w-full rounded-full bg-neutral-200/60 p-1"
      onKeyDown={(e) => {
        if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
        if (currentIndex < 0) return;
        const dir = e.key === "ArrowRight" ? 1 : -1;
        const next = (currentIndex + dir + options.length) % options.length;
        onChange(options[next].value);
        e.preventDefault();
      }}
    >
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            type="button"
            key={o.value}
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-full py-2 text-sm font-medium flex items-center justify-center gap-1 transition-colors ${
              active
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-800"
            }`}
          >
            {o.icon && (
              <span aria-hidden="true" className="text-base">
                {o.icon}
              </span>
            )}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}
