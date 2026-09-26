import { combineReducers, configureStore } from "@reduxjs/toolkit";
import auth from "../features/auth/authSlice";
import chat from "../features/chat/chatSlice";
import checkin from "../features/checkin/checkinSlice";
import profile from "../features/profile/profileSlice";
import progress from "../features/progress/progressSlice";
import wellness from "../features/wellness/wellnessSlice";

const rootReducer = combineReducers({ auth, chat, checkin, wellness, progress, profile });

export const makeStore = (preloadedState?: Partial<ReturnType<typeof rootReducer>>) =>
  configureStore({ reducer: rootReducer, preloadedState });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];
