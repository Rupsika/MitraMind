export type Lang = "en" | "hi" | "te" | "ta";

export interface User {
  id: string;
  name: string;
  email: string;
  preferredLanguage: Lang;
  timezone: string;
}

export interface Checkin {
  id: string;
  mood: number;
  stressLevel: number;
  energyLevel: number;
  sleepQuality: number;
  note?: string | null;
  createdAt: string;
}

export interface CheckinInput {
  mood: number;
  stressLevel: number;
  energyLevel: number;
  sleepQuality: number;
  note?: string;
}

export type Metric = "mood" | "stressLevel" | "energyLevel" | "sleepQuality";

export interface CheckinSummary {
  thisWeek: Record<Metric, number | null>;
  lastWeek: Record<Metric, number | null>;
  checkinsThisWeek: number;
  changes: { metric: Metric; direction: "higher" | "lower"; thisWeek: number; lastWeek: number }[];
}

export interface Source {
  title: string;
  page?: number | null;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "USER" | "ASSISTANT";
  content: string;
  language: Lang;
  sources?: Source[] | null;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  language: Lang;
  createdAt: string;
  updatedAt: string;
}

export interface Helplines {
  title: string;
  message: string;
  numbers: { name: string; number: string; availability: string }[];
}

export type RiskLevel = "NORMAL" | "DISTRESS" | "HIGH_CONCERN" | "CRISIS_SIGNAL";

export interface SendResult {
  userMessage: Message;
  assistantMessage: Message;
  riskLevel: RiskLevel;
  showCrisisResources: boolean;
  helplines: Helplines | null;
}

export type Category =
  | "STRESS"
  | "SLEEP"
  | "FOCUS"
  | "BREATHING"
  | "GROUNDING"
  | "STUDY_PRESSURE"
  | "GENERAL_WELLBEING";

export interface Resource {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: Category;
  duration: number;
  language: Lang;
  instructions: string[];
  source: string;
}

export interface Recommendation {
  resource: Resource;
  reason: string;
}

export interface Progress {
  days: number;
  series: { date: string; mood: number; stress: number; energy: number; sleep: number }[];
  activitiesCompleted: number;
  activityMinutes: number;
  frequentResources: { id: string; title: string; count: number }[];
}
