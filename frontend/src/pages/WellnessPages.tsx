import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CATEGORY_LABEL, ResourceCard } from "../components/ResourceCard";
import { Button, Card, ErrorNote, PageTitle } from "../components/ui";
import { completeResource, loadRecommendations, loadResources, startResource } from "../features/wellness/wellnessSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";

export function WellnessPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const { resources, status, error } = useAppSelector((s) => s.wellness);
  const [category, setCategory] = useState<string>("ALL");

  useEffect(() => {
    void dispatch(loadResources());
  }, [dispatch]);

  const categories = ["ALL", ...Object.keys(CATEGORY_LABEL)];
  const visible = resources.filter((r) => category === "ALL" || r.category === category);

  return (
    <div>
      <PageTitle>{t("wellness.title")}</PageTitle>
      <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Categories">
        {categories.map((c) => (
          <button
            key={c}
            type="button"
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
            className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
              category === c ? "border-primary bg-primary-soft font-medium text-primary-dark" : "border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {c === "ALL" ? t("wellness.all") : CATEGORY_LABEL[c]}
          </button>
        ))}
      </div>
      {status === "loading" && <p className="text-sm text-muted">{t("common.loading")}</p>}
      {status === "error" && <ErrorNote>{error ?? "Could not load activities."}</ErrorNote>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((r) => (
          <ResourceCard key={r.id} resource={r} />
        ))}
      </div>
    </div>
  );
}

export function ResourceDetailPage() {
  const t = useT();
  const { id = "" } = useParams();
  const dispatch = useAppDispatch();
  const resource = useAppSelector((s) => s.wellness.resources.find((r) => r.id === id));
  const done = useAppSelector((s) => s.wellness.completedIds.includes(id));
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!resource) void dispatch(loadResources());
  }, [resource, dispatch]);

  useEffect(() => {
    if (resource && !started) {
      setStarted(true);
      void dispatch(startResource(resource.id));
    }
  }, [resource, started, dispatch]);

  if (!resource) return <p className="text-sm text-muted">{t("common.loading")}</p>;

  return (
    <div className="mx-auto max-w-xl">
      <Link to="/wellness" className="text-sm text-muted hover:text-ink">
        ← {t("wellness.back")}
      </Link>
      <h1 className="mt-3 text-xl font-semibold">{resource.title}</h1>
      <p className="mt-1 text-sm text-muted">
        {resource.duration} {t("wellness.minutes")} · {CATEGORY_LABEL[resource.category]}
      </p>
      <p className="mt-3 text-sm">{resource.description}</p>
      <Card className="mt-5">
        <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm leading-relaxed">
          {resource.instructions.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </Card>
      <p className="mt-3 text-xs text-muted">{resource.source}</p>
      <div className="mt-5">
        {done ? (
          <p role="status" className="text-sm text-primary-dark">
            {t("wellness.completed")}
          </p>
        ) : (
          <Button
            type="button"
            onClick={async () => {
              await dispatch(completeResource(resource.id));
              void dispatch(loadRecommendations());
            }}
          >
            {t("wellness.complete")}
          </Button>
        )}
      </div>
    </div>
  );
}
