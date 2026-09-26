import { useEffect, useState } from "react";
import { TrendChart } from "../components/TrendChart";
import { Card, ErrorNote, PageTitle } from "../components/ui";
import { loadProgress } from "../features/progress/progressSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";

export function ProgressPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const lang = useAppSelector((s) => s.profile.language);
  const { data, status } = useAppSelector((s) => s.progress);
  const [days, setDays] = useState(7);

  useEffect(() => {
    void dispatch(loadProgress(days));
  }, [days, dispatch]);

  return (
    <div>
      <PageTitle sub={t("progress.last", { n: days })}>{t("progress.title")}</PageTitle>
      <div className="mb-5 flex gap-2" role="group" aria-label="Range">
        {[7, 30].map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={days === d}
            onClick={() => setDays(d)}
            className={`rounded-md border px-3 py-1.5 text-sm ${days === d ? "border-primary bg-primary-soft font-medium text-primary-dark" : "border-line bg-surface text-muted"}`}
          >
            {t("progress.last", { n: d })}
          </button>
        ))}
      </div>

      {status === "error" && <ErrorNote>Could not load your progress.</ErrorNote>}
      {status === "loading" && !data && <p className="text-sm text-muted">{t("common.loading")}</p>}

      {data && data.series.length === 0 && <p className="text-sm text-muted">{t("progress.empty")}</p>}
      {data && data.series.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <TrendChart data={data.series} dataKey="mood" label={t("checkin.mood")} lang={lang} />
          </Card>
          <Card>
            <TrendChart data={data.series} dataKey="stress" label={t("checkin.stress")} lang={lang} />
          </Card>
          <Card>
            <TrendChart data={data.series} dataKey="sleep" label={t("checkin.sleep")} lang={lang} />
          </Card>
          <Card>
            <TrendChart data={data.series} dataKey="energy" label={t("checkin.energy")} lang={lang} />
          </Card>
        </div>
      )}

      {data && (
        <Card className="mt-4">
          <p>{t("progress.activities", { n: data.activitiesCompleted })}</p>
          {data.activityMinutes > 0 && <p className="mt-1 text-sm text-muted">{t("progress.minutes", { n: data.activityMinutes })}</p>}
          {data.frequentResources.length > 0 && (
            <ul className="mt-3 text-sm text-muted">
              {data.frequentResources.map((r) => (
                <li key={r.id}>
                  {r.title} × {r.count}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
