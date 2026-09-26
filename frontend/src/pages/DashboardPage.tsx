import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ResourceCard } from "../components/ResourceCard";
import { TrendChart } from "../components/TrendChart";
import { Card } from "../components/ui";
import { loadCheckins } from "../features/checkin/checkinSlice";
import { loadHistory } from "../features/chat/chatSlice";
import { loadRecommendations } from "../features/wellness/wellnessSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";
import { greetingKey } from "../utils/format";

export function DashboardPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((s) => s.auth.user);
  const lang = useAppSelector((s) => s.profile.language);
  const checkins = useAppSelector((s) => s.checkin.items);
  const recommendation = useAppSelector((s) => s.wellness.recommendations[0]);
  const lastConversation = useAppSelector((s) => s.chat.conversations[0]);

  useEffect(() => {
    void dispatch(loadCheckins());
    void dispatch(loadRecommendations());
    void dispatch(loadHistory());
  }, [dispatch]);

  const series = [...checkins]
    .slice(0, 7)
    .reverse()
    .map((c) => ({ date: c.createdAt, mood: c.mood, stress: c.stressLevel }));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-sm text-muted">
          {t(greetingKey())}, {user?.name.split(" ")[0]}.
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{t("home.howFeeling")}</h1>
        <div className="mt-4 grid max-w-md grid-cols-10 gap-1" role="group" aria-label={t("checkin.mood")}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => navigate(`/check-in?mood=${n}`)}
              aria-label={`${t("checkin.mood")} ${n}`}
              className="rounded-md border border-line bg-surface py-2 text-sm transition-colors hover:bg-primary-soft"
            >
              {n}
            </button>
          ))}
        </div>
        <div className="mt-1 flex max-w-md justify-between text-xs text-muted">
          <span>{t("checkin.low")}</span>
          <span>{t("checkin.high")}</span>
        </div>
      </header>

      <Card>
        <h2 className="mb-3 font-medium">{t("home.recent")}</h2>
        {series.length ? (
          <TrendChart data={series} dataKey="mood" label={t("checkin.mood")} lang={lang} height={130} />
        ) : (
          <p className="text-sm text-muted">{t("home.noCheckins")}</p>
        )}
      </Card>

      {recommendation && (
        <section>
          <h2 className="mb-2 font-medium">{t("home.tryThis")}</h2>
          <ResourceCard resource={recommendation.resource} reason={recommendation.reason} />
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {lastConversation ? (
          <p className="text-sm text-muted">
            {t("home.lastConversation")}:{" "}
            <Link to="/history" className="text-ink underline">
              {lastConversation.title}
            </Link>
          </p>
        ) : (
          <span />
        )}
        <Link to="/chat" className="font-medium text-primary hover:underline">
          {t("home.talk")} →
        </Link>
      </div>
    </div>
  );
}
