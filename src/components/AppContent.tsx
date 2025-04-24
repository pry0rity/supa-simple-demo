import { BrowserRouter as Router } from "react-router-dom";
import { Activity, ChevronLeft, ChevronRight } from "./Icons";
import * as Sentry from "@sentry/react";
import { AppNavigation } from "./AppNavigation";
import { AppRoutes } from "./AppRoutes";
import { useState } from "react";

export function AppContent() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <nav
          className={`${
            isCollapsed ? "w-16" : "w-64"
          } min-w-16 flex-shrink-0 bg-gray-800 p-4 overflow-y-auto transition-all duration-300 relative`}
        >
          <div className="text-white font-bold mb-8 flex items-center justify-center">
            <Activity className="flex-shrink-0" />
            {!isCollapsed && <span className="ml-2 truncate">Sentry Demo</span>}
          </div>
          <div className="space-y-1">
            <AppNavigation isCollapsed={isCollapsed} />
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute bottom-4 right-2 text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
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
