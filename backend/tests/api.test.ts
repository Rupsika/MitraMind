import request from "supertest";
import { createApp } from "../src/app";
import { prisma } from "../src/prisma/client";
import { aiClient } from "../src/services/aiClient";

jest.mock("../src/prisma/client", () => ({
  prisma: require("./helpers/fakePrisma").createFakePrisma(),
}));
jest.mock("../src/services/aiClient", () => ({
  aiClient: { chat: jest.fn(), analyzeSafety: jest.fn(), transcribe: jest.fn(), synthesize: jest.fn() },
}));

const db = prisma as any;
const ai = aiClient as jest.Mocked<typeof aiClient>;
const app = createApp();

async function signup(email = "asha@example.com", preferredLanguage = "te") {
  const res = await request(app)
    .post("/api/v1/auth/register")
    .send({ name: "Asha", email, password: "password123", preferredLanguage });
  return { token: res.body.token as string, user: res.body.user, auth: { Authorization: `Bearer ${res.body.token}` } };
}

const normalReply = {
  answer: "Try a slow breathing exercise.",
  language: "te",
  riskLevel: "NORMAL" as const,
  triggerType: "none",
  sources: [{ title: "who.txt", page: null }],
  showCrisisResources: false,
  helplines: null,
};

describe("auth", () => {
  it("registers, hashes the password and returns a token", async () => {
    const { user, token } = await signup("a1@example.com");
    expect(token).toBeTruthy();
    expect(user.preferredLanguage).toBe("te");
    expect(user.passwordHash).toBeUndefined();
    const stored = db.user.rows.find((u: any) => u.email === "a1@example.com");
    expect(stored.passwordHash).not.toContain("password123");
  });

  it("rejects duplicate email and weak input", async () => {
    await signup("dup@example.com");
    const dup = await request(app)
      .post("/api/v1/auth/register")
      .send({ name: "X", email: "dup@example.com", password: "password123" });
    expect(dup.status).toBe(409);
    const weak = await request(app).post("/api/v1/auth/register").send({ name: "X", email: "bad", password: "short" });
    expect(weak.status).toBe(400);
  });

  it("logs in with correct credentials only", async () => {
    await signup("login@example.com");
    const ok = await request(app).post("/api/v1/auth/login").send({ email: "login@example.com", password: "password123" });
    expect(ok.status).toBe(200);
    const bad = await request(app).post("/api/v1/auth/login").send({ email: "login@example.com", password: "wrong-pass" });
    expect(bad.status).toBe(401);
    const unknown = await request(app).post("/api/v1/auth/login").send({ email: "nobody@example.com", password: "password123" });
    expect(unknown.body.error.message).toBe(bad.body.error.message);
  });

  it("protects routes with JWT", async () => {
    expect((await request(app).get("/api/v1/auth/me")).status).toBe(401);
    expect((await request(app).get("/api/v1/auth/me").set("Authorization", "Bearer nope")).status).toBe(401);
    const { auth } = await signup("me@example.com");
    const me = await request(app).get("/api/v1/auth/me").set(auth);
    expect(me.body.user.email).toBe("me@example.com");
  });
});

describe("check-ins", () => {
  it("validates ranges and stores valid check-ins", async () => {
    const { auth } = await signup("c1@example.com");
    const bad = await request(app).post("/api/v1/checkins").set(auth).send({ mood: 11, stressLevel: 5, energyLevel: 5, sleepQuality: 5 });
    expect(bad.status).toBe(400);
    const good = await request(app)
      .post("/api/v1/checkins")
      .set(auth)
      .send({ mood: 6, stressLevel: 8, energyLevel: 4, sleepQuality: 5, note: "exams" });
    expect(good.status).toBe(201);
    const list = await request(app).get("/api/v1/checkins").set(auth);
    expect(list.body.checkins).toHaveLength(1);
  });

  it("summarises this week against last week without diagnosing", async () => {
    const { auth, user } = await signup("c2@example.com");
    const day = 86_400_000;
    db.moodCheckin.rows.push(
      { id: "a", userId: user.id, mood: 6, stressLevel: 3, energyLevel: 6, sleepQuality: 6, createdAt: new Date(Date.now() - 10 * day) },
      { id: "b", userId: user.id, mood: 6, stressLevel: 8, energyLevel: 6, sleepQuality: 6, createdAt: new Date(Date.now() - 1 * day) },
    );
    const res = await request(app).get("/api/v1/checkins/summary").set(auth);
    expect(res.body.changes).toEqual([expect.objectContaining({ metric: "stressLevel", direction: "higher" })]);
  });
});

describe("chat", () => {
  it("runs Node -> AI service, stores both messages with sources and titles the conversation", async () => {
    const { auth } = await signup("chat1@example.com");
    ai.chat.mockResolvedValue(normalReply);
    const conv = await request(app).post("/api/v1/chat/conversations").set(auth).send({ language: "te" });
    const id = conv.body.conversation.id;
    const sent = await request(app).post(`/api/v1/chat/${id}/messages`).set(auth).send({ content: "I am stressed about exams" });
    expect(sent.status).toBe(201);
    expect(sent.body.assistantMessage.sources).toEqual([{ title: "who.txt", page: null }]);
    expect(ai.chat).toHaveBeenCalledWith(expect.objectContaining({ language: "te", message: "I am stressed about exams" }));

    const got = await request(app).get(`/api/v1/chat/${id}`).set(auth);
    expect(got.body.messages.map((m: any) => m.role)).toEqual(["USER", "ASSISTANT"]);
    const history = await request(app).get("/api/v1/chat/history").set(auth);
    expect(history.body.conversations[0].title).toBe("I am stressed about exams");
  });

  it("passes prior messages as history", async () => {
    const { auth } = await signup("chat2@example.com");
    ai.chat.mockResolvedValue(normalReply);
    const id = (await request(app).post("/api/v1/chat/conversations").set(auth).send({})).body.conversation.id;
    await request(app).post(`/api/v1/chat/${id}/messages`).set(auth).send({ content: "first" });
    await request(app).post(`/api/v1/chat/${id}/messages`).set(auth).send({ content: "second" });
    const secondCall = ai.chat.mock.calls[1][0];
    expect(secondCall.history.map((h) => h.role)).toEqual(["user", "assistant"]);
  });

  it("records a safety event (without message text) for crisis signals", async () => {
    const { auth } = await signup("chat3@example.com");
    ai.chat.mockResolvedValue({
      ...normalReply,
      riskLevel: "CRISIS_SIGNAL",
      triggerType: "rule",
      showCrisisResources: true,
      helplines: { title: "t", message: "m", numbers: [{ name: "Kiran", number: "1800-599-0019", availability: "24/7" }] },
    });
    const id = (await request(app).post("/api/v1/chat/conversations").set(auth).send({})).body.conversation.id;
    const res = await request(app).post(`/api/v1/chat/${id}/messages`).set(auth).send({ content: "sensitive text" });
    expect(res.body.showCrisisResources).toBe(true);
    expect(res.body.helplines.numbers[0].number).toBe("1800-599-0019");
    const event = db.safetyEvent.rows.at(-1);
    expect(event).toMatchObject({ riskLevel: "CRISIS_SIGNAL", actionShown: "show_crisis_resources" });
    expect(JSON.stringify(event)).not.toContain("sensitive text");
  });

  it("does not let users read, post to or delete other users' conversations", async () => {
    const a = await signup("owner@example.com");
    const b = await signup("intruder@example.com");
    const id = (await request(app).post("/api/v1/chat/conversations").set(a.auth).send({})).body.conversation.id;
    expect((await request(app).get(`/api/v1/chat/${id}`).set(b.auth)).status).toBe(404);
    expect((await request(app).post(`/api/v1/chat/${id}/messages`).set(b.auth).send({ content: "hi" })).status).toBe(404);
    expect((await request(app).delete(`/api/v1/chat/${id}`).set(b.auth)).status).toBe(404);
    expect((await request(app).delete(`/api/v1/chat/${id}`).set(a.auth)).status).toBe(204);
  });

  it("surfaces an unavailable AI service as 503 and stores nothing", async () => {
    const { auth } = await signup("chat4@example.com");
    const { AppError } = jest.requireActual("../src/utils/errors");
    ai.chat.mockRejectedValue(new AppError(503, "down", "ai_unavailable"));
    const id = (await request(app).post("/api/v1/chat/conversations").set(auth).send({})).body.conversation.id;
    const res = await request(app).post(`/api/v1/chat/${id}/messages`).set(auth).send({ content: "hello" });
    expect(res.status).toBe(503);
    expect((await request(app).get(`/api/v1/chat/${id}`).set(auth)).body.messages).toHaveLength(0);
  });

  it("rejects invalid ids and empty content", async () => {
    const { auth } = await signup("chat5@example.com");
    expect((await request(app).get("/api/v1/chat/not-a-uuid").set(auth)).status).toBe(400);
    const id = (await request(app).post("/api/v1/chat/conversations").set(auth).send({})).body.conversation.id;
    expect((await request(app).post(`/api/v1/chat/${id}/messages`).set(auth).send({ content: "  " })).status).toBe(400);
  });
});

describe("resources, recommendations and progress", () => {
  async function seed() {
    const mk = (slug: string, category: string, duration = 5) =>
      db.wellnessResource.create({ data: { slug, title: slug, description: "d", category, duration, language: "en", instructions: ["x"], source: "s" } });
    return { stress: await mk("stress-1", "STRESS", 10), sleep: await mk("sleep-1", "SLEEP"), breathing: await mk("breath-1", "BREATHING") };
  }

  it("lists and filters resources", async () => {
    const { auth } = await signup("r1@example.com");
    await seed();
    const all = await request(app).get("/api/v1/resources").set(auth);
    expect(all.body.resources.length).toBeGreaterThanOrEqual(3);
    const filtered = await request(app).get("/api/v1/resources?category=SLEEP").set(auth);
    expect(filtered.body.resources.every((r: any) => r.category === "SLEEP")).toBe(true);
  });

  it("recommends by latest check-in, tracks completion and reports progress", async () => {
    const { auth } = await signup("r2@example.com");
    const seeded = await seed();
    await request(app).post("/api/v1/checkins").set(auth).send({ mood: 6, stressLevel: 9, energyLevel: 6, sleepQuality: 3 });

    const rec = await request(app).get("/api/v1/recommendations").set(auth);
    const categories = rec.body.recommendations.map((r: any) => r.resource.category);
    expect(categories).toEqual(expect.arrayContaining(["STRESS", "SLEEP"]));
    expect(rec.body.recommendations[0].reason).toMatch(/recorded/);

    const id = seeded.stress.id;
    expect((await request(app).post(`/api/v1/resources/${id}/start`).set(auth)).status).toBe(201);
    const done = await request(app).post(`/api/v1/resources/${id}/complete`).set(auth);
    expect(done.body.progress.status).toBe("COMPLETED");

    const progress = await request(app).get("/api/v1/progress?days=7").set(auth);
    expect(progress.body).toMatchObject({ activitiesCompleted: 1, activityMinutes: 10 });
    expect(progress.body.series).toHaveLength(1);

    // A just-completed resource is not recommended again straight away.
    const again = await request(app).get("/api/v1/recommendations").set(auth);
    expect(again.body.recommendations.map((r: any) => r.resource.id)).not.toContain(id);
  });

  it("404s for unknown resources", async () => {
    const { auth } = await signup("r3@example.com");
    expect((await request(app).post("/api/v1/resources/6f1f3b3a-2f0e-4c1a-9a51-7f2b8f0a1111/start").set(auth)).status).toBe(404);
  });
});

describe("safety and voice proxies", () => {
  it("proxies safety analysis", async () => {
    const { auth } = await signup("s1@example.com");
    ai.analyzeSafety.mockResolvedValue({ riskLevel: "DISTRESS", triggerType: "rule", showCrisisResources: false, helplines: null, action: "x" });
    const res = await request(app).post("/api/v1/safety/analyze").set(auth).send({ message: "I am stressed" });
    expect(res.body.riskLevel).toBe("DISTRESS");
  });

  it("requires an audio file and forwards it to transcription", async () => {
    const { auth } = await signup("v1@example.com");
    expect((await request(app).post("/api/v1/voice/transcribe").set(auth)).status).toBe(400);
    ai.transcribe.mockResolvedValue({ text: "hello" });
    const res = await request(app)
      .post("/api/v1/voice/transcribe")
      .set(auth)
      .field("language", "hi")
      .attach("file", Buffer.alloc(2000, 1), { filename: "a.wav", contentType: "audio/wav" });
    expect(res.body.text).toBe("hello");
    expect(ai.transcribe).toHaveBeenCalledWith(expect.any(Buffer), "a.wav", "audio/wav", "hi");
  });

  it("returns synthesized audio", async () => {
    const { auth } = await signup("v2@example.com");
    ai.synthesize.mockResolvedValue(Buffer.from("RIFF"));
    const res = await request(app).post("/api/v1/voice/synthesize").set(auth).send({ text: "hi", language: "en" });
    expect(res.headers["content-type"]).toContain("audio/wav");
  });
});

describe("platform", () => {
  it("has health, security headers and JSON 404s", async () => {
    const health = await request(app).get("/health");
    expect(health.body.status).toBe("ok");
    expect(health.headers["x-content-type-options"]).toBe("nosniff");
    const nf = await request(app).get("/api/v1/nope");
    expect(nf.status).toBe(404);
    expect(nf.body.error.code).toBe("not_found");
  });
});
