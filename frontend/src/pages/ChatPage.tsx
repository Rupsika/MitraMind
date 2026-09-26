import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { LanguageSelect } from "../components/LanguageSelect";
import { SupportPanel } from "../components/SupportPanel";
import { Button, ErrorNote, inputClass } from "../components/ui";
import {
  addPendingUserMessage,
  dismissChatError,
  loadHistory,
  newConversation,
  openConversation,
  sendMessage,
} from "../features/chat/chatSlice";
import { useVoiceRecorder } from "../hooks/useVoiceRecorder";
import { api, errorMessage } from "../services/api";
import type { Message } from "../services/types";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";
import { sourceLabel } from "../utils/format";

/** Older replies may still end with a model-written citation block; sources are shown separately. */
const stripCitations = (text: string) => text.split(/\n*\s*(?:Source Guidelines|Citations):/i)[0].trim();

function Bubble({ message, onListen }: { message: Message; onListen: (m: Message) => void }) {
  const t = useT();
  const mine = message.role === "USER";
  return (
    <div className={`rise flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2.5 text-sm leading-relaxed ${
          mine ? "bg-primary text-white" : "border border-line bg-surface"
        }`}
      >
        {mine ? message.content : stripCitations(message.content)}
        {!mine && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            {message.sources && message.sources.length > 0 && (
              <span>
                {t("chat.sources")}: {message.sources.map(sourceLabel).join(" · ")}
              </span>
            )}
            <button type="button" onClick={() => onListen(message)} className="underline hover:text-ink">
              {t("chat.listen")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ChatPage() {
  const t = useT();
  const dispatch = useAppDispatch();
  const lang = useAppSelector((s) => s.profile.language);
  const { messages, sending, error, safety, conversations, activeId } = useAppSelector((s) => s.chat);
  const [text, setText] = useState("");
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [showList, setShowList] = useState(false);
  const { state: recState, start, stop } = useVoiceRecorder();
  const endRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void dispatch(loadHistory());
  }, [dispatch]);

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: "smooth", block: "end" });
  }, [messages.length, sending, safety]);

  const play = async (content: string) => {
    try {
      const blob = await api.synthesize(stripCitations(content).slice(0, 2400), lang);
      audioRef.current?.pause();
      const audio = new Audio(URL.createObjectURL(blob));
      audioRef.current = audio;
      await audio.play();
    } catch (e) {
      setVoiceError(errorMessage(e, "Voice playback is unavailable right now."));
    }
  };

  const send = async (content: string, viaVoice = false) => {
    const clean = content.trim();
    if (!clean || sending) return;
    setVoiceError(null);
    dispatch(addPendingUserMessage({ content: clean, language: lang }));
    const res = await dispatch(sendMessage({ content: clean, language: lang }));
    if (sendMessage.fulfilled.match(res)) {
      void dispatch(loadHistory()); // pick up the auto-generated conversation title
      if (viaVoice) void play(res.payload.result.assistantMessage.content);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text;
    setText("");
    void send(value);
  };

  const releaseMic = async () => {
    const wav = await stop();
    if (!wav) return;
    try {
      const heard = await api.transcribe(wav, lang);
      if (heard.trim()) void send(heard, true);
      else setVoiceError("I could not hear anything. Please try again, or type your message.");
    } catch (e) {
      setVoiceError(errorMessage(e, "Voice input is unavailable right now. You can type instead."));
    }
  };

  const recording = recState === "recording";

  return (
    <div className="flex h-[calc(100dvh-9rem)] min-h-[420px] gap-4 md:h-[calc(100dvh-8rem)]">
      <aside className={`${showList ? "flex" : "hidden"} w-56 shrink-0 flex-col gap-1 overflow-y-auto md:flex`} aria-label={t("chat.history")}>
        <Button type="button" variant="secondary" onClick={() => dispatch(newConversation())}>
          {t("chat.new")}
        </Button>
        {conversations.length === 0 && <p className="p-2 text-xs text-muted">{t("chat.noHistory")}</p>}
        {conversations.slice(0, 30).map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => {
              void dispatch(openConversation(c.id));
              setShowList(false);
            }}
            className={`truncate rounded-md px-3 py-2 text-left text-sm ${c.id === activeId ? "bg-primary-soft font-medium" : "hover:bg-primary-soft"}`}
          >
            {c.title}
          </button>
        ))}
        <Link to="/history" className="px-3 py-2 text-xs text-muted underline">
          {t("chat.history")}
        </Link>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col rounded-lg border border-line bg-canvas" aria-label={t("chat.title")}>
        <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
          <h1 className="font-medium">{t("chat.title")}</h1>
          <div className="flex items-center gap-2">
            <button type="button" className="text-sm text-muted md:hidden" onClick={() => setShowList((v) => !v)}>
              {t("chat.history")}
            </button>
            <LanguageSelect compact />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex justify-start">
              <div className="max-w-[85%] rounded-lg border border-line bg-surface px-4 py-2.5 text-sm">{t("chat.greeting")}</div>
            </div>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} message={m} onListen={(msg) => void play(msg.content)} />
          ))}
          {sending && <p className="text-xs text-muted">{t("chat.thinking")}</p>}
          {safety?.helplines && <SupportPanel helplines={safety.helplines} />}
          {error && (
            <div className="flex items-center gap-3">
              <ErrorNote>{error}</ErrorNote>
              <button type="button" className="text-xs underline" onClick={() => dispatch(dismissChatError())}>
                OK
              </button>
            </div>
          )}
          {voiceError && <ErrorNote>{voiceError}</ErrorNote>}
          <div ref={endRef} />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-2 border-t border-line bg-surface p-3">
          <div className="flex gap-2">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                void start();
              }}
              onPointerUp={() => void releaseMic()}
              onPointerLeave={() => recording && void releaseMic()}
              onKeyDown={(e) => (e.key === " " || e.key === "Enter") && !recording && void start()}
              onKeyUp={(e) => (e.key === " " || e.key === "Enter") && void releaseMic()}
              disabled={sending || recState === "processing"}
              aria-pressed={recording}
              className={`shrink-0 rounded-md border px-3 py-2 text-sm transition-colors select-none disabled:opacity-50 ${
                recording ? "border-primary bg-primary text-white" : "border-line bg-surface hover:bg-primary-soft"
              }`}
            >
              🎙 {recording ? t("chat.recording") : t("chat.hold")}
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("chat.placeholder")}
              aria-label={t("chat.placeholder")}
              maxLength={2000}
              className={inputClass}
            />
            <Button type="submit" disabled={sending || !text.trim()}>
              {t("common.send")}
            </Button>
          </div>
          {recState === "denied" && <p className="text-xs text-alert">{t("chat.micDenied")}</p>}
          <p className="text-xs text-muted">{t("chat.disclaimer")}</p>
        </form>
      </section>
    </div>
  );
}
