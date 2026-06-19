import { Navigate, Outlet, useLocation } from "react-router-dom";

import { SessionService } from "../services/api";

export default function ProtectedRoute() {
  const location = useLocation();

  if (!SessionService.isAuthenticated() || !SessionService.hasDashboardAccess()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
