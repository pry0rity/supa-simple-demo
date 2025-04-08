import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  Database,
  Layers,
  Server,
  Cpu,
  Users,
  Home,
} from "./components/Icons";
import HomePage from "./pages/HomePage";
import SlowApiPage from "./pages/SlowApiPage";
import ErrorPage from "./pages/ErrorPage";
import DbQueryPage from "./pages/DbQueryPage";
import BatchRequestsPage from "./pages/BatchRequestsPage";
import ServerComponentPage from "./pages/ServerComponentPage";
import ClientComponentPage from "./pages/ClientComponentPage";

import * as Sentry from "@sentry/react";

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

Sentry.init({
  dsn: SENTRY_DSN,
  integrations: [
    // Basic auto-instrumentation
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  // Performance tracing sample rate
  tracesSampleRate: 1.0,
  // Session replay sample rate
  replaysSessionSampleRate: 0.1,
  // Error sampling
  replaysOnErrorSampleRate: 1.0,
  environment: "development",
  // Enable distributed tracing
  tracePropagationTargets: ["localhost", /^\/api\//],
});

const NavLink = ({
  to,
  icon: Icon,
  children,
}: {
  to: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <Link
    to={to}
    className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded text-gray-300 hover:text-white"
  >
    <Icon size={18} />
    <span>{children}</span>
  </Link>
);

// Wrap App with Sentry's error boundary component
const SentryRoutes = Sentry.withErrorBoundary(
  () => (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/slow-api" element={<SlowApiPage />} />
      <Route path="/error" element={<ErrorPage />} />
      <Route path="/db-query" element={<DbQueryPage />} />
      <Route path="/batch-requests" element={<BatchRequestsPage />} />
      <Route path="/server-component" element={<ServerComponentPage />} />
      <Route path="/client-component" element={<ClientComponentPage />} />
    </Routes>
  ),
  {
    fallback: (
      <div className="p-4 bg-red-100 text-red-700">
        An error has occurred in the application. We've been notified and are
        working on a fix.
      </div>
    ),
  }
);

function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <nav className="w-64 bg-gray-800 p-4">
          <div className="text-white font-bold mb-8 flex items-center">
            <Activity className="mr-2" />
            <span>Sentry Demo</span>
          </div>
          <div className="space-y-2">
            <NavLink to="/" icon={Home}>
              Home
            </NavLink>
            <NavLink to="/slow-api" icon={Server}>
              Slow API
            </NavLink>
            <NavLink to="/error" icon={AlertTriangle}>
              Error Demo
            </NavLink>
            <NavLink to="/db-query" icon={Database}>
              DB Query
            </NavLink>
            <NavLink to="/batch-requests" icon={Layers}>
              Batch Requests
            </NavLink>
            <NavLink to="/server-component" icon={Cpu}>
              Server Component
            </NavLink>
            <NavLink to="/client-component" icon={Users}>
              Client Component
            </NavLink>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <SentryRoutes />
        </main>
      </div>
    </Router>
  );
}

// Wrap with Sentry's routing integration
export default Sentry.withProfiler(App);