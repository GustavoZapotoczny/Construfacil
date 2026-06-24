import { clsx } from "@/lib/cx";

interface ToggleProps {
  ligado: boolean;
  onChange: (valor: boolean) => void;
  label?: string;
}

export function Toggle({ ligado, onChange, label }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ligado}
      aria-label={label}
      onClick={() => onChange(!ligado)}
      className={clsx(
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition",
        ligado ? "bg-orange-500" : "bg-stone-300",
      )}
    >
      <span
        className={clsx(
          "inline-block h-5 w-5 transform rounded-full bg-white shadow transition",
          ligado ? "translate-x-5" : "translate-x-0.5",
        )}
      />
    </button>
  );
}
