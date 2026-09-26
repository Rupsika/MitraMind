import { Link } from "react-router-dom";
import { LanguageSelect } from "../components/LanguageSelect";
import { Button } from "../components/ui";
import { useAppSelector, useT } from "../store/hooks";
import { LANGUAGES } from "../utils/i18n";

export function LandingPage() {
  const t = useT();
  const signedIn = useAppSelector((s) => !!s.auth.user);
  const primaryTo = signedIn ? "/check-in" : "/register";
  const secondaryTo = signedIn ? "/chat" : "/login";

  const sections = [
    { title: t("landing.talkTitle"), body: t("landing.talkBody") },
    { title: t("landing.reflectTitle"), body: t("landing.reflectBody") },
    { title: t("landing.exploreTitle"), body: t("landing.exploreBody") },
  ];

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-4">
      <header className="flex items-center justify-between py-5">
        <span className="text-lg font-semibold text-primary-dark">MitraMind</span>
        <div className="flex items-center gap-3">
          <LanguageSelect compact />
          {!signedIn && (
            <Link to="/login" className="text-sm text-muted hover:text-ink">
              {t("auth.login")}
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="py-14 sm:py-20">
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            {t("landing.tagline1")}
            <br />
            {t("landing.tagline2")}
          </h1>
          <p className="mt-5 max-w-xl text-base text-muted">{t("landing.body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={primaryTo}>
              <Button type="button">{t("landing.checkin")}</Button>
            </Link>
            <Link to={secondaryTo}>
              <Button type="button" variant="secondary">
                {t("landing.talk")}
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted" aria-label="Supported languages">
            {LANGUAGES.map((l) => l.label).join(" · ")}
          </p>
        </section>

        <section className="grid gap-4 border-t border-line py-10 sm:grid-cols-3">
          {sections.map((s) => (
            <div key={s.title}>
              <h2 className="font-medium">{s.title}</h2>
              <p className="mt-1 text-sm text-muted">{s.body}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-line py-6 text-xs text-muted">{t("landing.disclaimer")}</footer>
    </div>
  );
}
