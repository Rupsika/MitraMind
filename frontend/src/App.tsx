import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { sessionExpired } from "./features/auth/authSlice";
import { AppLayout } from "./layouts/AppLayout";
import { GuestRoute, ProtectedRoute } from "./layouts/ProtectedRoute";
import { CheckInPage } from "./pages/CheckInPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HistoryPage } from "./pages/HistoryPage";
import { LandingPage } from "./pages/LandingPage";
import { LoginPage, RegisterPage } from "./pages/AuthPages";
import { ProfilePage, SettingsPage } from "./pages/ProfilePage";
import { ProgressPage } from "./pages/ProgressPage";
import { ResourceDetailPage, WellnessPage } from "./pages/WellnessPages";
import { UNAUTHORIZED_EVENT } from "./services/api";
import { useAppDispatch } from "./store/hooks";

export default function App() {
  const dispatch = useAppDispatch();
  useEffect(() => {
    const onExpired = () => dispatch(sessionExpired());
    window.addEventListener(UNAUTHORIZED_EVENT, onExpired);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onExpired);
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/check-in" element={<CheckInPage />} />
          <Route path="/wellness" element={<WellnessPage />} />
          <Route path="/wellness/:id" element={<ResourceDetailPage />} />
          <Route path="/resources" element={<Navigate to="/wellness" replace />} />
          <Route path="/progress" element={<ProgressPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
