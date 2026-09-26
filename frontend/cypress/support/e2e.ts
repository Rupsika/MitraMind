/**
 * The e2e specs run the real React app against a stubbed /api/v1 (cy.intercept), so they need
 * neither Postgres nor the AI service. Full-stack checks (real DB + Gemini) are done manually
 * with `docker compose up`. Safety cases use predefined test phrases only.
 */
export interface Stub {
  user: { id: string; name: string; email: string; preferredLanguage: string; timezone: string };
}

export function stubApi(opts: { chatReply?: Record<string, unknown> } = {}) {
  const user = { id: "u1", name: "Asha", email: "asha@example.com", preferredLanguage: "en", timezone: "Asia/Kolkata" };
  const resource = {
    id: "11111111-1111-4111-8111-111111111111", slug: "box-breathing", title: "Box breathing",
    description: "A slow, even breathing pattern.", category: "BREATHING", duration: 3, language: "en",
    instructions: ["Breathe in for 4.", "Hold for 4."], source: "curated",
  };
  let checkins: unknown[] = [];
  let completed = 0;

  cy.intercept("POST", "/api/v1/auth/register", (req) => {
    user.preferredLanguage = req.body.preferredLanguage;
    req.reply({ statusCode: 201, body: { user, token: "tok" } });
  }).as("register");
  cy.intercept("POST", "/api/v1/auth/login", { body: { user, token: "tok" } }).as("login");
  cy.intercept("GET", "/api/v1/auth/me", (req) => req.reply({ body: { user } }));
  cy.intercept("PATCH", "/api/v1/auth/me", (req) => {
    Object.assign(user, req.body);
    req.reply({ body: { user } });
  }).as("updateProfile");

  cy.intercept("POST", "/api/v1/checkins", (req) => {
    const c = { id: "c1", ...req.body, createdAt: new Date().toISOString() };
    checkins = [c, ...checkins];
    req.reply({ statusCode: 201, body: { checkin: c } });
  }).as("checkin");
  cy.intercept("GET", "/api/v1/checkins/summary", { body: { thisWeek: {}, lastWeek: {}, checkinsThisWeek: 1, changes: [] } });
  cy.intercept("GET", "/api/v1/checkins", (req) => req.reply({ body: { checkins } }));

  cy.intercept("GET", "/api/v1/recommendations", {
    body: { recommendations: [{ resource, reason: "Your latest check-in recorded a high stress level." }] },
  });
  cy.intercept("GET", "/api/v1/resources", { body: { resources: [resource] } });
  cy.intercept("POST", "/api/v1/resources/*/start", { statusCode: 201, body: {} });
  cy.intercept("POST", "/api/v1/resources/*/complete", (req) => {
    completed += 1;
    req.reply({ body: {} });
  }).as("complete");
  cy.intercept("GET", "/api/v1/progress*", (req) =>
    req.reply({
      body: {
        days: 7,
        series: (checkins as { createdAt: string; mood: number; stressLevel: number; energyLevel: number; sleepQuality: number }[]).map((c) => ({
          date: c.createdAt, mood: c.mood, stress: c.stressLevel, energy: c.energyLevel, sleep: c.sleepQuality,
        })),
        activitiesCompleted: completed, activityMinutes: completed * 3, frequentResources: [],
      },
    }),
  );

  cy.intercept("GET", "/api/v1/chat/history", { body: { conversations: [] } });
  cy.intercept("POST", "/api/v1/chat/conversations", (req) =>
    req.reply({ statusCode: 201, body: { conversation: { id: "22222222-2222-4222-8222-222222222222", title: "New conversation", language: req.body.language, createdAt: "", updatedAt: "" } } }),
  ).as("createConversation");
  cy.intercept("POST", "/api/v1/chat/*/messages", (req) =>
    req.reply({
      statusCode: 201,
      body: {
        userMessage: { id: "m1", conversationId: "x", role: "USER", content: req.body.content, language: req.body.language, createdAt: "" },
        assistantMessage: {
          id: "m2", conversationId: "x", role: "ASSISTANT", content: "That sounds like a heavy week. A slow breathing exercise may help.",
          language: req.body.language, sources: [{ title: "nimhans_stress_guide.txt", page: null }], createdAt: "",
        },
        riskLevel: "DISTRESS", showCrisisResources: false, helplines: null,
        ...opts.chatReply,
      },
    }),
  ).as("sendMessage");
}
