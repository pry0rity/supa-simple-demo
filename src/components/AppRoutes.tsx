import { Routes, Route } from "react-router-dom";
import * as Sentry from "@sentry/react";
import HomePage from "../pages/HomePage";
import SlowApiPage from "../pages/SlowApiPage";
import ErrorPage from "../pages/ErrorPage";
import DbQueryPage from "../pages/DbQueryPage";
import BatchRequestsPage from "../pages/BatchRequestsPage";
import NPlusOneQueryPage from "../pages/NPlusOneQueryPage";
import ServerComponentPage from "../pages/ServerComponentPage";
import ClientComponentPage from "../pages/ClientComponentPage";
import ThirdPartyApiPage from "../pages/ThirdPartyApiPage";

export function AppRoutesComponent() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/slow-api" element={<SlowApiPage />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/db-query" element={<DbQueryPage />} />
      <Route path="/batch-requests" element={<BatchRequestsPage />} />
      <Route path="/nplus1" element={<NPlusOneQueryPage />} />
      <Route path="/server-component" element={<ServerComponentPage />} />
      <Route path="/client-component" element={<ClientComponentPage />} />
      <Route path="/third-party-api" element={<ThirdPartyApiPage />} />
    </Routes>
  );
}

// Wrap with Sentry's error boundary component
export const AppRoutes = Sentry.withErrorBoundary(AppRoutesComponent, {
  fallback: (
    <div className="p-4 bg-red-100 text-red-700">
      An error has occurred in the application. We've been notified and are
      working on a fix.
    </div>
  ),
});