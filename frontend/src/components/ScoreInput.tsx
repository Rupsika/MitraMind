import { useT } from "../store/hooks";

/** 1–10 selector rendered as an accessible radio group. */
export function ScoreInput({ label, name, value, onChange }: { label: string; name: string; value: number; onChange: (v: number) => void }) {
  const t = useT();
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{label}</legend>
      <div className="grid grid-cols-10 gap-1" role="radiogroup" aria-label={label}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <label
            key={n}
            className={`cursor-pointer rounded-md border py-2 text-center text-sm transition-colors ${
              value === n ? "border-primary bg-primary text-white" : "border-line bg-surface hover:bg-primary-soft"
            }`}
          >
            <input
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
              aria-label={`${label} ${n}`}
            />
            {n}
          </label>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted">
        <span>{t("checkin.low")}</span>
        <span>{t("checkin.high")}</span>
      </div>
    </fieldset>
  );
}
