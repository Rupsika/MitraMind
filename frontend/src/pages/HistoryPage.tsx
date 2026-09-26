import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PageTitle } from "../components/ui";
import { deleteConversation, loadHistory, openConversation } from "../features/chat/chatSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";
import { groupByDay } from "../utils/format";

const LABELS = {
  en: { today: "Today", yesterday: "Yesterday" },
  hi: { today: "आज", yesterday: "कल" },
  te: { today: "ఈ రోజు", yesterday: "నిన్న" },
  ta: { today: "இன்று", yesterday: "நேற்று" },
} as const;

export function HistoryPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const lang = useAppSelector((s) => s.profile.language);
  const conversations = useAppSelector((s) => s.chat.conversations);

  useEffect(() => {
    void dispatch(loadHistory());
  }, [dispatch]);

  const groups = groupByDay(conversations, lang, LABELS[lang]);

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle>{t("chat.history")}</PageTitle>
      {groups.length === 0 && (
        <p className="text-sm text-muted">
          {t("chat.noHistory")}{" "}
          <Link to="/chat" className="text-primary underline">
            {t("home.talk")}
          </Link>
        </p>
      )}
      {groups.map((g) => (
        <section key={g.label} className="mb-5">
          <h2 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{g.label}</h2>
          <ul className="flex flex-col divide-y divide-line rounded-lg border border-line bg-surface">
            {g.items.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-left text-sm hover:underline"
                  onClick={async () => {
                    await dispatch(openConversation(c.id));
                    navigate("/chat");
                  }}
                >
                  {c.title}
                </button>
                <button
                  type="button"
                  className="text-xs text-muted hover:text-alert"
                  onClick={() => {
                    if (window.confirm(t("chat.delete") + "?")) void dispatch(deleteConversation(c.id));
                  }}
                >
                  {t("chat.delete")}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
