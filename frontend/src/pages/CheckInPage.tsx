import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ScoreInput } from "../components/ScoreInput";
import { Button, Card, ErrorNote, PageTitle, inputClass } from "../components/ui";
import { loadSummary, resetSubmitted, submitCheckin } from "../features/checkin/checkinSlice";
import { loadRecommendations } from "../features/wellness/wellnessSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";
import type { TKey } from "../utils/i18n";

export function CheckInPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const [params] = useSearchParams();
  const { submitting, submitted, error, summary } = useAppSelector((s) => s.checkin);
  const initialMood = Number(params.get("mood"));
  const [mood, setMood] = useState(initialMood >= 1 && initialMood <= 10 ? initialMood : 5);
  const [stress, setStress] = useState(5);
  const [energy, setEnergy] = useState(5);
  const [sleep, setSleep] = useState(5);
  const [note, setNote] = useState("");

  useEffect(() => {
    dispatch(resetSubmitted());
  }, [dispatch]);

  useEffect(() => {
    if (submitted) {
      void dispatch(loadSummary());
      void dispatch(loadRecommendations());
    }
  }, [submitted, dispatch]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    void dispatch(
      submitCheckin({ mood, stressLevel: stress, energyLevel: energy, sleepQuality: sleep, note: note.trim() || undefined }),
    );
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl">
        <PageTitle>{t("checkin.title")}</PageTitle>
        <Card className="flex flex-col gap-4">
          <p role="status">{t("checkin.saved")}</p>
          {summary?.changes.map((c) => (
            <p key={c.metric} className="text-sm text-muted">
              {t(`checkin.pattern.${c.metric}.${c.direction}` as TKey)}
            </p>
          ))}
          <div className="flex gap-3">
            <Link to="/dashboard">
              <Button variant="secondary" type="button">
                {t("nav.home")}
              </Button>
            </Link>
            <Link to="/chat">
              <Button type="button">{t("home.talk")}</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle>{t("checkin.title")}</PageTitle>
      <form onSubmit={submit} className="flex flex-col gap-6">
        <ScoreInput label={t("checkin.mood")} name="mood" value={mood} onChange={setMood} />
        <ScoreInput label={t("checkin.stress")} name="stress" value={stress} onChange={setStress} />
        <ScoreInput label={t("checkin.energy")} name="energy" value={energy} onChange={setEnergy} />
        <ScoreInput label={t("checkin.sleep")} name="sleep" value={sleep} onChange={setSleep} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="note" className="text-sm font-medium">
            {t("checkin.note")}
          </label>
          <textarea id="note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
        <div>
          <Button type="submit" disabled={submitting}>
            {t("common.save")}
          </Button>
        </div>
      </form>
    </div>
  );
}
