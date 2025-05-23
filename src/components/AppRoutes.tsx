import { Routes, Route } from "react-router-dom";
import * as Sentry from "@sentry/react";
import HomePage from "../pages/HomePage";
import SlowApiPage from "../pages/SlowApiPage";
import ErrorPage from "../pages/ErrorPage";
import DbQueryPage from "../pages/DbQueryPage";
import BatchRequestsPage from "../pages/BatchRequestsPage";
import { SupabaseNPlusOnePage } from "../pages/SupabaseNPlusOnePage";
import { JsonPlaceholderNPlusOnePage } from "../pages/JsonPlaceholderNPlusOnePage";
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
      <Route path="/nplus1" element={<SupabaseNPlusOnePage />} />
      <Route path="/nplus1-debug" element={<JsonPlaceholderNPlusOnePage />} />
      <Route path="/client-component" element={<ClientComponentPage />} />
      <Route path="/third-party-api" element={<ThirdPartyApiPage />} />
    </Routes>
  );
}

// Wrap with Sentry's error boundary component that resets on route changes
export const AppRoutes = () => {
  // Using useLocation from react-router would cause this component to re-render on route changes,
  // effectively resetting the error boundary
  return (
    <Sentry.ErrorBoundary
      fallback={({ resetError }) => (
        <div className="p-4 bg-red-100 text-red-700">
          <p className="mb-4">
            An error has occurred in the application. We've been notified and are
            working on a fix.
          </p>
          <button 
            onClick={resetError}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
        </div>
      )}
    >
      <AppRoutesComponent />
    </Sentry.ErrorBoundary>
  );
};
