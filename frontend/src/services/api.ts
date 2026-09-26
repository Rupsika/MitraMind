import axios from "axios";
import type {
  Checkin,
  CheckinInput,
  CheckinSummary,
  Conversation,
  Lang,
  Message,
  Progress,
  Recommendation,
  Resource,
  SendResult,
  User,
} from "./types";

const TOKEN_KEY = "mitramind.token";

export const tokenStore = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (t: string) => {
    try {
      localStorage.setItem(TOKEN_KEY, t);
    } catch {
      /* storage unavailable */
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* storage unavailable */
    }
  },
};

export const UNAUTHORIZED_EVENT = "mitramind:unauthorized";

export const http = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? "/api/v1", timeout: 90_000 });

http.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

http.interceptors.response.use(
  (r) => r,
  (error) => {
    const isAuthCall = String(error.config?.url ?? "").startsWith("/auth/login");
    if (error.response?.status === 401 && !isAuthCall) {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(error)) return error.response?.data?.error?.message ?? fallback;
  return fallback;
}

export const api = {
  register: (b: { name: string; email: string; password: string; preferredLanguage: Lang; timezone: string }) =>
    http.post<{ user: User; token: string }>("/auth/register", b).then((r) => r.data),
  login: (b: { email: string; password: string }) => http.post<{ user: User; token: string }>("/auth/login", b).then((r) => r.data),
  me: () => http.get<{ user: User }>("/auth/me").then((r) => r.data.user),
  logout: () => http.post("/auth/logout").catch(() => undefined),
  updateProfile: (b: Partial<Pick<User, "name" | "preferredLanguage" | "timezone">> & { notificationPreferences?: Record<string, boolean> }) =>
    http.patch<{ user: User }>("/auth/me", b).then((r) => r.data.user),

  createCheckin: (b: CheckinInput) => http.post<{ checkin: Checkin }>("/checkins", b).then((r) => r.data.checkin),
  listCheckins: () => http.get<{ checkins: Checkin[] }>("/checkins").then((r) => r.data.checkins),
  checkinSummary: () => http.get<CheckinSummary>("/checkins/summary").then((r) => r.data),

  createConversation: (language: Lang) =>
    http.post<{ conversation: Conversation }>("/chat/conversations", { language }).then((r) => r.data.conversation),
  chatHistory: () => http.get<{ conversations: Conversation[] }>("/chat/history").then((r) => r.data.conversations),
  getConversation: (id: string) =>
    http.get<{ conversation: Conversation; messages: Message[] }>(`/chat/${id}`).then((r) => r.data),
  sendMessage: (id: string, content: string, language: Lang) =>
    http.post<SendResult>(`/chat/${id}/messages`, { content, language }).then((r) => r.data),
  deleteConversation: (id: string) => http.delete(`/chat/${id}`),

  listResources: () => http.get<{ resources: Resource[] }>("/resources").then((r) => r.data.resources),
  getResource: (id: string) => http.get<{ resource: Resource }>(`/resources/${id}`).then((r) => r.data.resource),
  startResource: (id: string) => http.post(`/resources/${id}/start`),
  completeResource: (id: string) => http.post(`/resources/${id}/complete`),
  recommendations: () => http.get<{ recommendations: Recommendation[] }>("/recommendations").then((r) => r.data.recommendations),
  progress: (days: number) => http.get<Progress>("/progress", { params: { days } }).then((r) => r.data),

  transcribe: (audio: Blob, language: Lang) => {
    const form = new FormData();
    form.append("file", audio, "audio.wav");
    form.append("language", language);
    return http.post<{ text: string }>("/voice/transcribe", form).then((r) => r.data.text);
  },
  synthesize: (text: string, language: Lang) =>
    http.post("/voice/synthesize", { text, language }, { responseType: "blob" }).then((r) => r.data as Blob),
};
