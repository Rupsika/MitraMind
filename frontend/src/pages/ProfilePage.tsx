import { useState, type FormEvent } from "react";
import { LanguageSelect } from "../components/LanguageSelect";
import { Button, Card, ErrorNote, Field, PageTitle, inputClass } from "../components/ui";
import { updateProfile } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";

export function ProfilePage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const user = useAppSelector((s) => s.auth.user)!;
  const [name, setName] = useState(user.name);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const res = await dispatch(updateProfile({ name: name.trim() }));
    setSaved(updateProfile.fulfilled.match(res));
    setFailed(updateProfile.rejected.match(res));
  };

  return (
    <div className="mx-auto max-w-md">
      <PageTitle>{t("profile.title")}</PageTitle>
      <Card>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <Field label={t("auth.name")} id="profile-name">
            <input id="profile-name" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </Field>
          <Field label={t("auth.email")} id="profile-email">
            <input id="profile-email" value={user.email} readOnly className={`${inputClass} bg-canvas text-muted`} />
          </Field>
          <Field label={t("common.language")} id="profile-language">
            <LanguageSelect />
          </Field>
          {failed && <ErrorNote>Could not save your changes.</ErrorNote>}
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={!name.trim()}>
              {t("common.save")}
            </Button>
            {saved && (
              <span role="status" className="text-sm text-primary-dark">
                {t("profile.saved")}
              </span>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}

export function SettingsPage() {
  const t = useT();
  return (
    <div className="mx-auto max-w-md">
      <PageTitle>{t("settings.title")}</PageTitle>
      <Card>
        <Field label={t("common.language")} id="settings-language">
          <LanguageSelect />
        </Field>
      </Card>
    </div>
  );
}
