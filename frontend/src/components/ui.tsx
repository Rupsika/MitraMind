import type { ButtonHTMLAttributes, ReactNode } from "react";

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" }) {
  const styles = {
    primary: "bg-primary text-white hover:bg-primary-dark disabled:opacity-50",
    secondary: "border border-line bg-surface text-ink hover:bg-primary-soft disabled:opacity-50",
    ghost: "text-primary hover:bg-primary-soft disabled:opacity-50",
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${styles} ${className}`}
    />
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-lg border border-line bg-surface p-5 ${className}`}>{children}</section>;
}

export function Field({ label, id, children }: { label: string; id: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-md border border-line bg-surface px-3 py-2 text-sm placeholder:text-muted focus:border-primary";

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="text-xl font-semibold">{children}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </header>
  );
}

export function ErrorNote({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-md border border-line bg-alert-soft px-3 py-2 text-sm text-alert">
      {children}
    </p>
  );
}
