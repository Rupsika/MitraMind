import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, errorMessage } from "../../services/api";
import type { Checkin, CheckinInput, CheckinSummary } from "../../services/types";

interface State {
  items: Checkin[];
  summary: CheckinSummary | null;
  submitting: boolean;
  submitted: boolean;
  error: string | null;
}

const initialState: State = { items: [], summary: null, submitting: false, submitted: false, error: null };

export const loadCheckins = createAsyncThunk("checkin/load", () => api.listCheckins());
export const loadSummary = createAsyncThunk("checkin/summary", () => api.checkinSummary());
export const submitCheckin = createAsyncThunk("checkin/submit", async (b: CheckinInput, { rejectWithValue }) => {
  try {
    return await api.createCheckin(b);
  } catch (e) {
    return rejectWithValue(errorMessage(e));
  }
});

const slice = createSlice({
  name: "checkin",
  initialState,
  reducers: {
    resetSubmitted(s) {
      s.submitted = false;
      s.error = null;
    },
  },
  extraReducers: (b) => {
    b.addCase(loadCheckins.fulfilled, (s, a) => void (s.items = a.payload))
      .addCase(loadSummary.fulfilled, (s, a) => void (s.summary = a.payload))
      .addCase(submitCheckin.pending, (s) => {
        s.submitting = true;
        s.error = null;
      })
      .addCase(submitCheckin.fulfilled, (s, a) => {
        s.submitting = false;
        s.submitted = true;
        s.items = [a.payload, ...s.items];
      })
      .addCase(submitCheckin.rejected, (s, a) => {
        s.submitting = false;
        s.error = (a.payload as string) ?? "Could not save your check-in";
      });
  },
});

export const { resetSubmitted } = slice.actions;
export default slice.reducer;
