import { BrowserRouter as Router } from "react-router-dom";
import { Activity } from "./Icons";
import * as Sentry from "@sentry/react";
import { AppNavigation } from "./AppNavigation";
import { AppRoutes } from "./AppRoutes";

export function AppContent() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <nav className="w-64 min-w-64 flex-shrink-0 bg-gray-800 p-4 overflow-y-auto">
          <div className="text-white font-bold mb-8 flex items-center">
            <Activity className="flex-shrink-0 mr-2" />
            <span className="truncate">Sentry Demo</span>
          </div>
          <div className="space-y-2">
            <AppNavigation />
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
          <AppRoutes />
        </main>
      </div>
    </Router>
  );
}

// Create a named component for the profiled version
export const ProfiledApp = Sentry.withProfiler(AppContent);

// Export the profiled component as default
export default ProfiledApp;