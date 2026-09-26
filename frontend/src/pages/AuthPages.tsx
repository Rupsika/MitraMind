import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LanguageSelect } from "../components/LanguageSelect";
import { Button, ErrorNote, Field, inputClass } from "../components/ui";
import { clearAuthError, loginUser, registerUser } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";

function AuthShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <Link to="/" className="mb-6 text-lg font-semibold text-primary-dark">
        MitraMind
      </Link>
      <h1 className="mb-5 text-xl font-semibold">{title}</h1>
      {children}
    </div>
  );
}

export function LoginPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const error = useAppSelector((s) => s.auth.error);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await dispatch(loginUser({ email, password }));
    setBusy(false);
    if (loginUser.fulfilled.match(res)) navigate((location.state as { from?: string } | null)?.from ?? "/dashboard", { replace: true });
  };

  return (
    <AuthShell title={t("auth.login")}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label={t("auth.email")} id="email">
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("auth.password")} id="password">
          <input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" disabled={busy || !email || !password}>
          {t("auth.login")}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted">
        {t("auth.noAccount")}{" "}
        <Link to="/register" onClick={() => dispatch(clearAuthError())} className="text-primary underline">
          {t("auth.register")}
        </Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const error = useAppSelector((s) => s.auth.error);
  const language = useAppSelector((s) => s.profile.language);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const res = await dispatch(registerUser({ name, email, password, preferredLanguage: language }));
    setBusy(false);
    if (registerUser.fulfilled.match(res)) navigate("/dashboard", { replace: true });
  };

  return (
    <AuthShell title={t("auth.register")}>
      <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
        <Field label={t("auth.name")} id="name">
          <input id="name" autoComplete="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("auth.email")} id="email">
          <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("auth.password")} id="password">
          <input id="password" type="password" autoComplete="new-password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
          <span className="text-xs text-muted">8+</span>
        </Field>
        <Field label={t("common.language")} id="language">
          <LanguageSelect />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" disabled={busy || !name || !email || password.length < 8}>
          {t("auth.register")}
        </Button>
      </form>
      <p className="mt-5 text-sm text-muted">
        {t("auth.haveAccount")}{" "}
        <Link to="/login" onClick={() => dispatch(clearAuthError())} className="text-primary underline">
          {t("auth.login")}
        </Link>
      </p>
    </AuthShell>
  );
}
