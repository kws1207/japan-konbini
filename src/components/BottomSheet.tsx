import { ReactNode } from "react";

type Props = {
  expanded: boolean;
  onToggleExpanded: () => void;
  peek: ReactNode;
  children: ReactNode;
};

export function BottomSheet({
  expanded,
  onToggleExpanded,
  peek,
  children,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-cream border-t border-black/10 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
      <button
        type="button"
        onClick={onToggleExpanded}
        aria-expanded={expanded}
        aria-label={expanded ? "Collapse panel" : "Expand panel"}
        className="w-full px-4 pt-2 pb-3 flex flex-col items-stretch gap-2 text-left"
      >
        <span
          aria-hidden="true"
          className="mx-auto w-10 h-1 rounded-full bg-neutral-300"
        />
        <div className="flex items-center gap-2 flex-wrap">{peek}</div>
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-4 pt-2 pb-[max(1rem,env(safe-area-inset-bottom))] flex flex-col gap-4 max-h-[70dvh] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
