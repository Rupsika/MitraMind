import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Lang } from "../../services/types";
import { fetchMe, loginUser, registerUser, updateProfile } from "../auth/authSlice";

const LANG_KEY = "mitramind.lang";
const VALID: Lang[] = ["en", "hi", "te", "ta"];

function storedLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY) as Lang | null;
    if (v && VALID.includes(v)) return v;
  } catch {
    /* storage unavailable */
  }
  return "en";
}

/** UI + chat language. Follows the account's preferred language once signed in. */
const slice = createSlice({
  name: "profile",
  initialState: { language: storedLang() as Lang },
  reducers: {
    setLanguage(state, a: PayloadAction<Lang>) {
      state.language = a.payload;
      try {
        localStorage.setItem(LANG_KEY, a.payload);
      } catch {
        /* storage unavailable */
      }
    },
  },
  extraReducers: (b) => {
    const adopt = (s: { language: Lang }, a: { payload: { preferredLanguage: Lang } }) => {
      s.language = a.payload.preferredLanguage;
    };
    b.addCase(loginUser.fulfilled, adopt)
      .addCase(registerUser.fulfilled, adopt)
      .addCase(fetchMe.fulfilled, adopt)
      .addCase(updateProfile.fulfilled, adopt);
  },
});

export const { setLanguage } = slice.actions;
export default slice.reducer;
