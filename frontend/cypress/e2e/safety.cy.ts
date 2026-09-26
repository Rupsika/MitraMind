import { stubApi } from "../support/e2e";

// Predefined test case only: the stub returns what the AI service returns for a CRISIS_SIGNAL
// classification. Classification itself is covered by ai-service pytest + tests/evaluation.
describe("Safety flow", () => {
  beforeEach(() => {
    stubApi({
      chatReply: {
        riskLevel: "CRISIS_SIGNAL",
        showCrisisResources: true,
        helplines: {
          title: "Emergency mental health helplines (India)",
          message: "Please reach out to one of these support channels, or to someone you trust:",
          numbers: [{ name: "Kiran (Govt. of India)", number: "1800-599-0019", availability: "24/7, toll-free" }],
        },
      },
    });
    cy.visit("/login");
    cy.get("#email").type("asha@example.com");
    cy.get("#password").type("password123");
    cy.get("button[type=submit]").click();
  });

  it("shows verified support resources for a crisis-level response", () => {
    cy.visit("/chat");
    cy.get("input[aria-label='Type a message…']").type("predefined crisis test message");
    cy.contains("button", "Send").click();
    cy.get("[aria-label='Support is available']").within(() => {
      cy.contains("Please reach out");
      cy.contains("a", "1800-599-0019").should("have.attr", "href", "tel:18005990019");
    });
  });
});
