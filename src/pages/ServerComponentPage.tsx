import React, { Suspense } from "react";
import { Server } from "../components/Icons";
import * as Sentry from "@sentry/react";

interface ServerState {
  loading: boolean;
  data: { message: string; timestamp?: string } | null;
  error: string | null;
}

// Server Component with proper backend integration
const ServerComponent = () => {
  const [state, setState] = React.useState<ServerState>({
    loading: true,
    data: null,
    error: null,
  });

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch("/api/slow");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        setState((prev) => ({ ...prev, loading: false, data: result }));
      } catch (error) {
        console.error("Error:", error);
        Sentry.captureException(error, {
          tags: { component: "ServerComponent" },
        });
        setState((prev) => ({
          ...prev,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred",
        }));
      }
    };

    loadData();
  }, []);

  if (state.loading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded"></div>;
  }

  if (state.error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
        <p className="font-medium">Error:</p>
        <p>{state.error}</p>
      </div>
    );
  }

  const timestamp = state.data?.timestamp || new Date().toISOString();

  return (
    <div className="space-y-4">
      {/* Formatted display */}
      <div className="p-4 bg-orange-50 text-orange-700 rounded">
        <h3 className="font-semibold mb-3">Server Response</h3>

        <div className="mb-4 p-3 bg-white rounded shadow-sm border border-orange-100">
          <div className="text-lg">{state.data?.message}</div>
          <div className="text-xs text-orange-500 mt-2">
            Timestamp: {new Date(timestamp).toLocaleString()}
          </div>
        </div>

        <div className="text-sm bg-orange-100 p-2 rounded">
          <strong>Note:</strong> This component retrieves data from the server
          when it loads.
        </div>
      </div>

      {/* Raw JSON */}
      <div>
        <h3 className="font-semibold mb-2 text-sm text-gray-600">Raw JSON:</h3>
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto border border-gray-200">
          {JSON.stringify(state.data, null, 2)}
        </pre>
      </div>
    </div>
  );
};

const ServerComponentPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Server className="mr-2 text-orange-600" />
        <h2 className="text-2xl font-bold">Server Component Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
          }
        >
          <ServerComponent />
        </Suspense>
      </div>
    </div>
  );
};

export default ServerComponentPage;
