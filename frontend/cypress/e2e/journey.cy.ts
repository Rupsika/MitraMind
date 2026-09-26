import { stubApi } from "../support/e2e";

describe("MitraMind main journey", () => {
  beforeEach(() => stubApi());

  it("register → Telugu → check-in → chat with sources → activity → progress", () => {
    cy.visit("/");
    cy.contains("A little support,").should("be.visible");
    cy.contains("English · हिन्दी · తెలుగు · தமிழ்");
    cy.contains("a", "Log in").click();
    cy.contains("a", "Create account").click();

    // Register with Telugu selected
    cy.get("#name").type("Asha");
    cy.get("#email").type("asha@example.com");
    cy.get("#password").type("password123");
    cy.get("select[aria-label='Language']").select("te");
    cy.get("button[type=submit]").click();
    cy.wait("@register").its("request.body").should("include", { preferredLanguage: "te" });

    // Dashboard renders in Telugu
    cy.location("pathname").should("eq", "/dashboard");
    cy.contains("ఈ రోజు మీకు ఎలా అనిపిస్తోంది?");
    cy.get("select[aria-label]").select("en");

    // Check-in
    cy.contains("a", "Check-in").first().click({ force: true });
    cy.get("input[name=stress][value='8']").check({ force: true });
    cy.contains("button", "Save").click();
    cy.wait("@checkin").its("request.body").should("include", { stressLevel: 8 });
    cy.contains("Check-in saved");

    // Chat: grounded response with a visible source
    cy.visit("/chat");
    cy.get("input[aria-label='Type a message…']").type("I am stressed about exams");
    cy.contains("button", "Send").click();
    cy.wait("@sendMessage");
    cy.contains("slow breathing exercise");
    cy.contains("Sources: Nimhans stress guide");

    // Wellness activity
    cy.contains("a", "Wellness").first().click({ force: true });
    cy.contains("Box breathing").parents("article").contains("a", "Start").click();
    cy.contains("Breathe in for 4.");
    cy.contains("button", "Mark as done").click();
    cy.wait("@complete");
    cy.contains("Activity recorded");

    // Progress
    cy.contains("a", "Progress").first().click({ force: true });
    cy.contains("1 activities completed");
  });
});
