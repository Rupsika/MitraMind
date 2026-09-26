import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { api, errorMessage } from "../../services/api";
import type { Recommendation, Resource } from "../../services/types";

interface State {
  resources: Resource[];
  recommendations: Recommendation[];
  status: "idle" | "loading" | "ready" | "error";
  completedIds: string[];
  error: string | null;
}

const initialState: State = { resources: [], recommendations: [], status: "idle", completedIds: [], error: null };

export const loadResources = createAsyncThunk("wellness/load", async (_: void, { rejectWithValue }) => {
  try {
    return await api.listResources();
  } catch (e) {
    return rejectWithValue(errorMessage(e));
  }
});
export const loadRecommendations = createAsyncThunk("wellness/recommendations", () => api.recommendations());
export const startResource = createAsyncThunk("wellness/start", async (id: string) => {
  await api.startResource(id);
  return id;
});
export const completeResource = createAsyncThunk("wellness/complete", async (id: string) => {
  await api.completeResource(id);
  return id;
});

const slice = createSlice({
  name: "wellness",
  initialState,
  reducers: {},
  extraReducers: (b) => {
    b.addCase(loadResources.pending, (s) => void (s.status = "loading"))
      .addCase(loadResources.fulfilled, (s, a) => {
        s.resources = a.payload;
        s.status = "ready";
      })
      .addCase(loadResources.rejected, (s, a) => {
        s.status = "error";
        s.error = (a.payload as string) ?? null;
      })
      .addCase(loadRecommendations.fulfilled, (s, a) => void (s.recommendations = a.payload))
      .addCase(completeResource.fulfilled, (s, a) => void s.completedIds.push(a.payload));
  },
});

export default slice.reducer;
