import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, errorMessage, tokenStore } from "../../services/api";
import type { Lang, User } from "../../services/types";

interface AuthState {
  user: User | null;
  /** "idle" until we know whether a stored token is valid. */
  status: "idle" | "loading" | "ready";
  error: string | null;
}

const initialState: AuthState = { user: null, status: tokenStore.get() ? "idle" : "ready", error: null };

export const registerUser = createAsyncThunk(
  "auth/register",
  async (b: { name: string; email: string; password: string; preferredLanguage: Lang }, { rejectWithValue }) => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
      const res = await api.register({ ...b, timezone });
      tokenStore.set(res.token);
      return res.user;
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  },
);

export const loginUser = createAsyncThunk(
  "auth/login",
  async (b: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const res = await api.login(b);
      tokenStore.set(res.token);
      return res.user;
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  },
);

export const fetchMe = createAsyncThunk("auth/me", async (_: void, { rejectWithValue }) => {
  try {
    return await api.me();
  } catch (e) {
    tokenStore.clear();
    return rejectWithValue(errorMessage(e));
  }
});

export const logoutUser = createAsyncThunk("auth/logout", async () => {
  await api.logout();
  tokenStore.clear();
});

export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (b: Partial<Pick<User, "name" | "preferredLanguage" | "timezone">>, { rejectWithValue }) => {
    try {
      return await api.updateProfile(b);
    } catch (e) {
      return rejectWithValue(errorMessage(e));
    }
  },
);

const slice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    sessionExpired(state) {
      state.user = null;
      state.status = "ready";
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(registerUser.pending, (s) => void (s.error = null))
      .addCase(registerUser.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = "ready";
      })
      .addCase(registerUser.rejected, (s, a) => void (s.error = (a.payload as string) ?? "Could not create account"))
      .addCase(loginUser.pending, (s) => void (s.error = null))
      .addCase(loginUser.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = "ready";
      })
      .addCase(loginUser.rejected, (s, a) => void (s.error = (a.payload as string) ?? "Could not log in"))
      .addCase(fetchMe.pending, (s) => void (s.status = "loading"))
      .addCase(fetchMe.fulfilled, (s, a) => {
        s.user = a.payload;
        s.status = "ready";
      })
      .addCase(fetchMe.rejected, (s) => {
        s.user = null;
        s.status = "ready";
      })
      .addCase(logoutUser.fulfilled, (s) => {
        s.user = null;
      })
      .addCase(updateProfile.fulfilled, (s, a) => void (s.user = a.payload));
  },
});

export const { sessionExpired, clearAuthError } = slice.actions;
export default slice.reducer;
