type Props = {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
};

export function GoFab({ onClick, disabled, isLoading }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={
        isLoading ? "Loading new location" : "Roll a new random place"
      }
      className={`fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 w-14 h-14 rounded-full text-white flex items-center justify-center text-xl font-bold transition-transform ${
        disabled
          ? "bg-neutral-400 shadow-none"
          : "bg-vermillion shadow-[3px_3px_0_#1a1a1a] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_#1a1a1a]"
      }`}
    >
      {isLoading ? (
        <span
          aria-hidden="true"
          className="w-5 h-5 rounded-full border-2 border-white/40 border-t-white animate-spin"
        />
      ) : (
        <span aria-hidden="true">➡️</span>
      )}
    </button>
  );
}
