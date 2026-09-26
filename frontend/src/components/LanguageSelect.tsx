import { setLanguage } from "../features/profile/profileSlice";
import { updateProfile } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";
import type { Lang } from "../services/types";
import { LANGUAGES } from "../utils/i18n";

/** Switches the UI/chat language and, when signed in, remembers it on the account. */
export function LanguageSelect({ compact = false }: { compact?: boolean }) {
  const dispatch = useAppDispatch();
  const t = useT();
  const language = useAppSelector((s) => s.profile.language);
  const signedIn = useAppSelector((s) => !!s.auth.user);

  const change = (lang: Lang) => {
    dispatch(setLanguage(lang));
    if (signedIn) void dispatch(updateProfile({ preferredLanguage: lang }));
  };

  return (
    <select
      aria-label={t("common.language")}
      value={language}
      onChange={(e) => change(e.target.value as Lang)}
      className={`rounded-md border border-line bg-surface text-sm ${compact ? "px-2 py-1" : "px-3 py-2"}`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.label}
        </option>
      ))}
    </select>
  );
}
