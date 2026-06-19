import { Navigate, Outlet } from "react-router-dom";

import { SessionService } from "../services/api";

export default function CoordinatorRoute() {
  if (!SessionService.isCoordinator()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
