import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageSelect } from "../components/LanguageSelect";
import { ResourceCard } from "../components/ResourceCard";
import { SupportPanel } from "../components/SupportPanel";
import { LoginPage } from "../pages/AuthPages";
import { ChatPage } from "../pages/ChatPage";
import { CheckInPage } from "../pages/CheckInPage";
import { DashboardPage } from "../pages/DashboardPage";
import { ProgressPage } from "../pages/ProgressPage";
import { api } from "../services/api";
import type { Resource } from "../services/types";
import { groupByDay, sourceLabel } from "../utils/format";
import { renderWithProviders, testUser } from "./utils";

vi.mock("../services/api", async (orig) => {
  const actual = await orig<typeof import("../services/api")>();
  const fn = () => vi.fn();
  return {
    ...actual,
    api: {
      login: fn(), register: fn(), me: fn(), logout: fn(), updateProfile: fn(),
      createCheckin: fn(), listCheckins: fn(), checkinSummary: fn(),
      createConversation: fn(), chatHistory: fn(), getConversation: fn(), sendMessage: fn(), deleteConversation: fn(),
      listResources: fn(), getResource: fn(), startResource: fn(), completeResource: fn(),
      recommendations: fn(), progress: fn(), transcribe: fn(), synthesize: fn(),
    },
  };
});

const mocked = api as unknown as Record<keyof typeof api, ReturnType<typeof vi.fn>>;

const resource: Resource = {
  id: "r1", slug: "box", title: "Box breathing", description: "Slow even breathing.", category: "BREATHING",
  duration: 3, language: "en", instructions: ["Breathe in"], source: "curated",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocked.listCheckins.mockResolvedValue([]);
  mocked.recommendations.mockResolvedValue([]);
  mocked.chatHistory.mockResolvedValue([]);
});

describe("Login", () => {
  it("submits credentials and shows server errors", async () => {
    mocked.login.mockRejectedValue({ isAxiosError: true, response: { data: { error: { message: "Incorrect email or password" } } } });
    renderWithProviders(<LoginPage />, { route: "/login" });
    await userEvent.type(screen.getByLabelText("Email"), "asha@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrongpass1");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(mocked.login).toHaveBeenCalledWith({ email: "asha@example.com", password: "wrongpass1" });
    expect(await screen.findByRole("alert")).toHaveTextContent(/incorrect|could not log in/i);
  });

  it("stores the token and navigates on success", async () => {
    mocked.login.mockResolvedValue({ user: testUser, token: "tok" });
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>dashboard-page</p>} />
      </Routes>,
      { route: "/login" },
    );
    await userEvent.type(screen.getByLabelText("Email"), "asha@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "password123");
    await userEvent.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("dashboard-page")).toBeInTheDocument();
    expect(localStorage.getItem("mitramind.token")).toBe("tok");
  });
});

describe("Dashboard", () => {
  it("shows the greeting, prompt and an empty state without check-ins", async () => {
    renderWithProviders(<DashboardPage />, { signedIn: true });
    expect(screen.getByText("How are you feeling today?")).toBeInTheDocument();
    expect(screen.getByText(/Asha/)).toBeInTheDocument();
    expect(await screen.findByText(/No check-ins yet/)).toBeInTheDocument();
  });

  it("shows one recommendation when available", async () => {
    mocked.recommendations.mockResolvedValue([{ resource, reason: "Your latest check-in recorded a high stress level." }]);
    renderWithProviders(<DashboardPage />, { signedIn: true });
    expect(await screen.findByText("Box breathing")).toBeInTheDocument();
    expect(screen.getByText(/recorded a high stress/)).toBeInTheDocument();
  });
});

describe("Check-in", () => {
  it("submits selected scores and shows descriptive patterns", async () => {
    mocked.createCheckin.mockResolvedValue({ id: "c1", mood: 7, stressLevel: 5, energyLevel: 5, sleepQuality: 5, createdAt: new Date().toISOString() });
    mocked.checkinSummary.mockResolvedValue({
      thisWeek: { mood: 7, stressLevel: 8, energyLevel: 5, sleepQuality: 5 },
      lastWeek: { mood: 7, stressLevel: 4, energyLevel: 5, sleepQuality: 5 },
      checkinsThisWeek: 3,
      changes: [{ metric: "stressLevel", direction: "higher", thisWeek: 8, lastWeek: 4 }],
    });
    renderWithProviders(<CheckInPage />, { signedIn: true, route: "/check-in?mood=7" });
    await userEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(mocked.createCheckin).toHaveBeenCalledWith({ mood: 7, stressLevel: 5, energyLevel: 5, sleepQuality: 5, note: undefined });
    expect(await screen.findByText(/recorded stress level was higher this week/)).toBeInTheDocument();
    expect(screen.queryByText(/anxiety|depress/i)).not.toBeInTheDocument();
  });
});

describe("Chat", () => {
  it("creates a conversation, sends the message and shows the reply with sources", async () => {
    mocked.createConversation.mockResolvedValue({ id: "c1", title: "New conversation", language: "en", createdAt: "", updatedAt: "" });
    mocked.sendMessage.mockResolvedValue({
      userMessage: { id: "m1", conversationId: "c1", role: "USER", content: "I am stressed about exams", language: "en", createdAt: "" },
      assistantMessage: {
        id: "m2", conversationId: "c1", role: "ASSISTANT", content: "That sounds hard. Try slow breathing.", language: "en",
        sources: [{ title: "nimhans_stress_guide.txt", page: null }], createdAt: "",
      },
      riskLevel: "DISTRESS", showCrisisResources: false, helplines: null,
    });
    renderWithProviders(<ChatPage />, { signedIn: true });
    await userEvent.type(screen.getByLabelText("Type a message…"), "I am stressed about exams");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText(/Try slow breathing/)).toBeInTheDocument();
    expect(mocked.sendMessage).toHaveBeenCalledWith("c1", "I am stressed about exams", "en");
    expect(screen.getByText(/Nimhans stress guide/)).toBeInTheDocument();
  });

  it("shows verified helplines for crisis responses", async () => {
    mocked.createConversation.mockResolvedValue({ id: "c1", title: "x", language: "en", createdAt: "", updatedAt: "" });
    mocked.sendMessage.mockResolvedValue({
      userMessage: { id: "m1", conversationId: "c1", role: "USER", content: "x", language: "en", createdAt: "" },
      assistantMessage: { id: "m2", conversationId: "c1", role: "ASSISTANT", content: "You are not alone.", language: "en", createdAt: "" },
      riskLevel: "CRISIS_SIGNAL", showCrisisResources: true,
      helplines: { title: "t", message: "Please reach out.", numbers: [{ name: "Kiran", number: "1800-599-0019", availability: "24/7" }] },
    });
    renderWithProviders(<ChatPage />, { signedIn: true });
    await userEvent.type(screen.getByLabelText("Type a message…"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    const link = await screen.findByRole("link", { name: "1800-599-0019" });
    expect(link).toHaveAttribute("href", "tel:18005990019");
  });

  it("shows a friendly error and keeps the input usable when the AI is down", async () => {
    mocked.createConversation.mockResolvedValue({ id: "c1", title: "x", language: "en", createdAt: "", updatedAt: "" });
    mocked.sendMessage.mockRejectedValue(new Error("boom"));
    renderWithProviders(<ChatPage />, { signedIn: true });
    await userEvent.type(screen.getByLabelText("Type a message…"), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(/could not reply/i);
    expect(screen.getByLabelText("Type a message…")).toBeEnabled();
  });
});

describe("Language selector", () => {
  it("switches UI labels to Telugu and saves the preference", async () => {
    mocked.updateProfile.mockResolvedValue({ ...testUser, preferredLanguage: "te" });
    renderWithProviders(<><LanguageSelect /><DashboardPage /></>, { signedIn: true });
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Language" }), "te");
    expect(await screen.findByText("ఈ రోజు మీకు ఎలా అనిపిస్తోంది?")).toBeInTheDocument();
    await waitFor(() => expect(mocked.updateProfile).toHaveBeenCalledWith({ preferredLanguage: "te" }));
  });
});

describe("Resource card", () => {
  it("shows title, duration, category and a start link", () => {
    renderWithProviders(<ResourceCard resource={resource} />);
    expect(screen.getByText("Box breathing")).toBeInTheDocument();
    expect(screen.getByText(/3 min · Breathing/)).toBeInTheDocument();
    expect(screen.getByRole("link")).toHaveAttribute("href", "/wellness/r1");
  });
});

describe("Support panel", () => {
  it("renders every helpline with a call link", () => {
    renderWithProviders(
      <SupportPanel helplines={{ title: "t", message: "m", numbers: [
        { name: "Tele-MANAS", number: "14416 or 1800-891-4416", availability: "24/7" },
        { name: "iCall", number: "+91 91529 87821", availability: "Mon-Sat" },
      ] }} />,
    );
    const links = screen.getAllByRole("link");
    expect(links[0]).toHaveAttribute("href", "tel:14416");
    expect(links[1]).toHaveAttribute("href", "tel:+919152987821");
  });
});

describe("Progress", () => {
  it("renders activity totals and an empty state", async () => {
    mocked.progress.mockResolvedValue({ days: 7, series: [], activitiesCompleted: 4, activityMinutes: 25, frequentResources: [] });
    renderWithProviders(<ProgressPage />, { signedIn: true });
    expect(await screen.findByText("4 activities completed")).toBeInTheDocument();
    expect(screen.getByText(/Check in a few times/)).toBeInTheDocument();
  });
});

describe("format helpers", () => {
  it("prettifies source names", () => {
    expect(sourceLabel({ title: "who_mental_health_action_plan.txt" })).toBe("Who mental health action plan");
  });
  it("groups conversations by day", () => {
    const now = new Date("2026-09-26T12:00:00");
    const mk = (id: string, iso: string) => ({ id, title: id, language: "en" as const, createdAt: iso, updatedAt: iso });
    const groups = groupByDay(
      [mk("a", "2026-09-26T09:00:00"), mk("b", "2026-09-25T09:00:00"), mk("c", "2026-09-20T09:00:00")],
      "en", { today: "Today", yesterday: "Yesterday" }, now,
    );
    expect(groups.map((g) => g.label)).toEqual(["Today", "Yesterday", expect.stringMatching(/20/)]);
  });
});
