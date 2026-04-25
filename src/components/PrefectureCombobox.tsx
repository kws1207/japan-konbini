import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as d3 from "d3";
import { PREFECTURE_REGION } from "../util/prefectureRegions";
import { REGIONS, Region } from "../type";

type Props = {
  features: d3.ExtendedFeature[] | undefined;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  variant?: "mobile" | "desktop";
};

export function PrefectureCombobox({
  features,
  value,
  onChange,
  disabled,
  variant = "mobile",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const id = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Desktop popover: dismiss on outside click.
  useEffect(() => {
    if (!open || variant !== "desktop") return;
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (popoverRef.current?.contains(t)) return;
      if (triggerRef.current?.contains(t)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open, variant]);

  const grouped = useMemo(() => {
    const buckets = REGIONS.reduce((acc, r) => {
      acc[r] = [];
      return acc;
    }, {} as Record<Region, { nam: string; namJa: string }[]>);

    features?.forEach((f) => {
      const nam = f.properties?.nam as string | undefined;
      if (!nam) return;
      const region = PREFECTURE_REGION[nam];
      if (!region) return;

      const namJa = (f.properties?.nam_ja as string | undefined) ?? "";
      const q = query.trim().toLowerCase();
      if (
        q &&
        !nam.toLowerCase().includes(q) &&
        !namJa.toLowerCase().includes(q)
      ) {
        return;
      }
      buckets[region].push({ nam, namJa });
    });

    return REGIONS.map((r) => ({ region: r, items: buckets[r] })).filter(
      (g) => g.items.length > 0
    );
  }, [features, query]);

  const showAllEntry =
    query.trim() === "" || "all prefecture".includes(query.trim().toLowerCase());

  const triggerClass =
    variant === "desktop"
      ? "bg-white text-neutral-800 border border-neutral-300 rounded-sm px-[14px] py-[8px] text-[13px] inline-flex items-center gap-2 hover:border-neutral-500 disabled:opacity-60"
      : "inline-flex items-center gap-2 rounded-sm border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 disabled:opacity-60";

  const list = (
    <>
      {showAllEntry && (
        <button
          type="button"
          className={`w-full text-left px-4 py-3 text-sm border-b border-neutral-100 hover:bg-neutral-50 ${
            value === "All Prefecture" ? "bg-neutral-100 font-medium" : ""
          }`}
          onClick={() => {
            onChange("All Prefecture");
            setOpen(false);
          }}
        >
          All Prefecture
        </button>
      )}
      {grouped.map((g) => (
        <section key={g.region}>
          <h3 className="sticky top-0 bg-neutral-100/95 backdrop-blur px-4 py-1.5 text-xs font-semibold text-neutral-700 uppercase tracking-wider">
            {g.region}
          </h3>
          {g.items.map((it) => (
            <button
              type="button"
              key={it.nam}
              onClick={() => {
                onChange(it.nam);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm border-b border-neutral-100 hover:bg-neutral-50 ${
                value === it.nam ? "bg-neutral-100 font-medium" : ""
              }`}
            >
              <span>{it.nam}</span>
              {it.namJa && (
                <span className="ml-2 text-xs text-neutral-500">
                  {it.namJa}
                </span>
              )}
            </button>
          ))}
        </section>
      ))}
      {!showAllEntry && grouped.length === 0 && (
        <p className="px-4 py-6 text-center text-sm text-neutral-500">
          No matches.
        </p>
      )}
    </>
  );

  if (variant === "desktop") {
    return (
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={disabled}
          className={triggerClass}
        >
          <span aria-hidden="true">📍</span>
          <span>{value}</span>
          <span aria-hidden="true" className="text-neutral-400">
            ▾
          </span>
        </button>
        {open && (
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="Choose prefecture"
            className="absolute top-full left-0 mt-1 z-[60] w-[360px] max-h-[480px] flex flex-col bg-white border border-neutral-300 rounded-sm shadow-lg"
          >
            <div className="p-2 border-b border-neutral-200">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search prefecture..."
                className="w-full rounded-sm border border-neutral-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1 overflow-y-auto">{list}</div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        className={triggerClass}
      >
        <span aria-hidden="true">📍</span>
        <span>{value}</span>
        <span aria-hidden="true" className="text-neutral-400">
          ▾
        </span>
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[60] bg-white flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Choose prefecture"
          >
            <div className="flex items-center gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 border-b border-neutral-200">
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search prefecture..."
                className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                className="text-sm text-neutral-600 px-2 py-2"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
            </div>
            <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom)]">
              {list}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
