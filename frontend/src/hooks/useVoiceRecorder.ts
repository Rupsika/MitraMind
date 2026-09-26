import { useCallback, useRef, useState } from "react";
import { blobToWav } from "../utils/wav";

export type RecorderState = "idle" | "recording" | "processing" | "denied";

/** Hold-to-record microphone helper. `stop()` resolves with a WAV blob (or null if nothing usable). */
export function useVoiceRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const stream = useRef<MediaStream | null>(null);

  const start = useCallback(async () => {
    if (recorder.current || !navigator.mediaDevices?.getUserMedia) {
      if (!navigator.mediaDevices?.getUserMedia) setState("denied");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setState("denied");
      return;
    }
    chunks.current = [];
    const rec = new MediaRecorder(stream.current);
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.start();
    recorder.current = rec;
    setState("recording");
  }, []);

  const stop = useCallback((): Promise<Blob | null> => {
    const rec = recorder.current;
    if (!rec) return Promise.resolve(null);
    return new Promise((resolve) => {
      rec.onstop = async () => {
        stream.current?.getTracks().forEach((t) => t.stop());
        recorder.current = null;
        setState("processing");
        try {
          resolve(chunks.current.length ? await blobToWav(new Blob(chunks.current, { type: rec.mimeType })) : null);
        } catch {
          resolve(null);
        } finally {
          setState("idle");
        }
      };
      rec.stop();
    });
  }, []);

  return { state, start, stop };
}
