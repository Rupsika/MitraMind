import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api } from "../../services/api";
import type { Progress } from "../../services/types";

interface State {
  data: Progress | null;
  status: "idle" | "loading" | "ready" | "error";
}

export const loadProgress = createAsyncThunk("progress/load", (days: number) => api.progress(days));

const slice = createSlice({
  name: "progress",
  initialState: { data: null, status: "idle" } as State,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadProgress.pending, (s) => void (s.status = "loading"))
      .addCase(loadProgress.fulfilled, (s, a) => {
        s.data = a.payload;
        s.status = "ready";
      })
      .addCase(loadProgress.rejected, (s) => void (s.status = "error"));
  },
});

export default slice.reducer;
