import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { api, errorMessage } from "../../services/api";
import type { Conversation, Helplines, Lang, Message, RiskLevel } from "../../services/types";

interface State {
  conversations: Conversation[];
  activeId: string | null;
  messages: Message[];
  sending: boolean;
  error: string | null;
  /** Latest safety outcome for the open conversation. */
  safety: { riskLevel: RiskLevel; helplines: Helplines | null; show: boolean } | null;
}

const initialState: State = { conversations: [], activeId: null, messages: [], sending: false, error: null, safety: null };

export const loadHistory = createAsyncThunk("chat/history", () => api.chatHistory());

export const openConversation = createAsyncThunk("chat/open", (id: string) => api.getConversation(id));

export const deleteConversation = createAsyncThunk("chat/delete", async (id: string) => {
  await api.deleteConversation(id);
  return id;
});

export const sendMessage = createAsyncThunk(
  "chat/send",
  async (b: { content: string; language: Lang }, { getState, rejectWithValue }) => {
    try {
      let id = (getState() as { chat: State }).chat.activeId;
      let created: Conversation | null = null;
      if (!id) {
        created = await api.createConversation(b.language);
        id = created.id;
      }
      const result = await api.sendMessage(id, b.content, b.language);
      return { id, created, result };
    } catch (e) {
      return rejectWithValue(errorMessage(e, "Mitra could not reply just now. Please try again."));
    }
  },
);

const slice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    newConversation(s) {
      s.activeId = null;
      s.messages = [];
      s.safety = null;
      s.error = null;
    },
    dismissChatError(s) {
      s.error = null;
    },
    addPendingUserMessage(s, a: PayloadAction<{ content: string; language: Lang }>) {
      s.messages.push({
        id: `pending-${Date.now()}`,
        conversationId: s.activeId ?? "",
        role: "USER",
        content: a.payload.content,
        language: a.payload.language,
        createdAt: new Date().toISOString(),
      });
    },
  },
  extraReducers: (b) => {
    b.addCase(loadHistory.fulfilled, (s, a) => void (s.conversations = a.payload))
      .addCase(openConversation.fulfilled, (s, a) => {
        s.activeId = a.payload.conversation.id;
        s.messages = a.payload.messages;
        s.safety = null;
        s.error = null;
      })
      .addCase(sendMessage.pending, (s) => {
        s.sending = true;
        s.error = null;
      })
      .addCase(sendMessage.fulfilled, (s, a) => {
        const { id, created, result } = a.payload;
        s.sending = false;
        s.activeId = id;
        s.messages = [...s.messages.filter((m) => !m.id.startsWith("pending-")), result.userMessage, result.assistantMessage];
        s.safety =
          result.riskLevel === "NORMAL" || result.riskLevel === "DISTRESS"
            ? null
            : { riskLevel: result.riskLevel, helplines: result.helplines, show: true };
        if (created) s.conversations = [created, ...s.conversations];
      })
      .addCase(sendMessage.rejected, (s, a) => {
        s.sending = false;
        s.messages = s.messages.filter((m) => !m.id.startsWith("pending-"));
        s.error = (a.payload as string) ?? "Mitra could not reply just now.";
      })
      .addCase(deleteConversation.fulfilled, (s, a) => {
        s.conversations = s.conversations.filter((c) => c.id !== a.payload);
        if (s.activeId === a.payload) {
          s.activeId = null;
          s.messages = [];
          s.safety = null;
        }
      });
  },
});

export const { newConversation, dismissChatError, addPendingUserMessage } = slice.actions;
export default slice.reducer;
