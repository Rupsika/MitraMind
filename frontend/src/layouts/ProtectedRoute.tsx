import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { fetchMe } from "../features/auth/authSlice";
import { useAppDispatch, useAppSelector, useT } from "../store/hooks";

export function ProtectedRoute() {
  const dispatch = useAppDispatch();
  const t = useT();
  const location = useLocation();
  const { user, status } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (status === "idle") void dispatch(fetchMe());
  }, [status, dispatch]);

  if (status === "idle" || status === "loading") {
    return (
      <p role="status" className="p-8 text-center text-sm text-muted">
        {t("common.loading")}
      </p>
    );
  }
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

/** Sends already-signed-in users away from /login and /register. */
export function GuestRoute() {
  const user = useAppSelector((s) => s.auth.user);
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
}
