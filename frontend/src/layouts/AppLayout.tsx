import { NavLink, Outlet } from "react-router-dom";
import { LanguageSelect } from "../components/LanguageSelect";
import { logoutUser } from "../features/auth/authSlice";
import { useAppDispatch, useT } from "../store/hooks";
import type { TKey } from "../utils/i18n";

const NAV: { to: string; key: TKey; end?: boolean }[] = [
  { to: "/dashboard", key: "nav.home" },
  { to: "/chat", key: "nav.chat" },
  { to: "/check-in", key: "nav.checkin" },
  { to: "/wellness", key: "nav.wellness" },
  { to: "/progress", key: "nav.progress" },
  { to: "/profile", key: "nav.profile" },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-md px-3 py-1.5 text-sm transition-colors ${isActive ? "bg-primary-soft font-medium text-primary-dark" : "text-muted hover:text-ink"}`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded-md px-1.5 py-1.5 text-xs transition-colors ${isActive ? "bg-primary-soft font-medium text-primary-dark" : "text-muted"}`;

export function AppLayout() {
  const t = useT();
  const dispatch = useAppDispatch();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <NavLink to="/dashboard" className="text-lg font-semibold text-primary-dark">
            MitraMind
          </NavLink>
          <nav aria-label="Main" className="hidden gap-1 md:flex">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={linkClass}>
                {t(n.key)}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <LanguageSelect compact />
            <button
              type="button"
              onClick={() => void dispatch(logoutUser())}
              className="rounded-md px-2 py-1 text-sm text-muted hover:text-ink"
            >
              {t("common.logout")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:pb-8">
        <Outlet />
      </main>

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-line bg-surface px-1 py-1.5 md:hidden">
        {NAV.map((n) => (
          <NavLink key={n.to} to={n.to} className={mobileLinkClass}>
            {t(n.key)}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
