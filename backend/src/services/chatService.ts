import { prisma } from "../prisma/client";
import { AppError } from "../utils/errors";
import { aiClient } from "./aiClient";

const HISTORY_WINDOW = 10;

async function getOwned(userId: string, id: string) {
  const conversation = await prisma.conversation.findUnique({ where: { id } });
  // 404 (not 403) so conversation ids of other users are not revealed.
  if (!conversation || conversation.userId !== userId) throw new AppError(404, "Conversation not found", "not_found");
  return conversation;
}

const titleFrom = (text: string) => (text.length > 40 ? `${text.slice(0, 40).trimEnd()}…` : text);

export const chatService = {
  createConversation: (userId: string, input: { language?: string; title?: string }) =>
    prisma.conversation.create({ data: { userId, language: input.language ?? "en", ...(input.title ? { title: input.title } : {}) } }),

  history: (userId: string) =>
    prisma.conversation.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 100 }),

  async get(userId: string, id: string) {
    const conversation = await getOwned(userId, id);
    const messages = await prisma.message.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" } });
    return { conversation, messages };
  },

  async remove(userId: string, id: string) {
    await getOwned(userId, id);
    await prisma.conversation.delete({ where: { id } });
  },

  async sendMessage(userId: string, id: string, content: string, languageOverride?: string) {
    const conversation = await getOwned(userId, id);
    const language = languageOverride ?? conversation.language;

    const recent = await prisma.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: HISTORY_WINDOW,
    });
    const history = recent
      .reverse()
      .map((m) => ({ role: m.role === "USER" ? ("user" as const) : ("assistant" as const), content: m.content }));

    // Node owns auth + persistence; the AI service owns safety, RAG and generation.
    const ai = await aiClient.chat({ message: content, language, conversationId: id, history });

    const userMessage = await prisma.message.create({
      data: { conversationId: id, role: "USER", content, language },
    });
    const assistantMessage = await prisma.message.create({
      data: { conversationId: id, role: "ASSISTANT", content: ai.answer, language, sources: ai.sources },
    });

    const isFirst = recent.length === 0;
    await prisma.conversation.update({
      where: { id },
      data: { language, ...(isFirst && conversation.title === "New conversation" ? { title: titleFrom(content) } : {}) },
    });

    if (ai.riskLevel !== "NORMAL") {
      // Only the level/type/action are stored, never the message text.
      await prisma.safetyEvent.create({
        data: {
          userId,
          riskLevel: ai.riskLevel,
          triggerType: ai.triggerType ?? "unknown",
          actionShown: ai.showCrisisResources ? "show_crisis_resources" : ai.helplines ? "encourage_human_support" : "supportive_response",
        },
      });
    }

    return {
      userMessage,
      assistantMessage,
      riskLevel: ai.riskLevel,
      showCrisisResources: ai.showCrisisResources,
      helplines: ai.helplines,
    };
  },
};
