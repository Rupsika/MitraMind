import { Link } from "react-router-dom";
import { useT } from "../store/hooks";
import type { Resource } from "../services/types";
import { Button } from "./ui";

export const CATEGORY_LABEL: Record<string, string> = {
  STRESS: "Stress",
  SLEEP: "Sleep",
  FOCUS: "Focus",
  BREATHING: "Breathing",
  GROUNDING: "Grounding",
  STUDY_PRESSURE: "Study pressure",
  GENERAL_WELLBEING: "General wellbeing",
};

export function ResourceCard({ resource, reason }: { resource: Resource; reason?: string }) {
  const t = useT();
  return (
    <article className="flex flex-col gap-2 rounded-lg border border-line bg-surface p-4">
      <h3 className="font-medium">{resource.title}</h3>
      <p className="text-xs text-muted">
        {resource.duration} {t("wellness.minutes")} · {CATEGORY_LABEL[resource.category]}
      </p>
      <p className="text-sm">{resource.description}</p>
      {reason && <p className="text-xs text-muted">{reason}</p>}
      <div className="mt-1">
        <Link to={`/wellness/${resource.id}`}>
          <Button variant="secondary" type="button">
            {t("common.start")}
          </Button>
        </Link>
      </div>
    </article>
  );
}
