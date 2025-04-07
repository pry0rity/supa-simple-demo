import React, { Suspense } from "react";
import { Server } from "../components/Icons";
import * as Sentry from "@sentry/react";

interface ServerData {
  message: string;
  timestamp?: string;
}

// Server Component with proper backend integration
const ServerComponent = () => {
  const [data, setData] = React.useState<ServerData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      // Start a transaction for component loading
      const transaction = Sentry.startTransaction({
        name: "server.component.load",
        op: "component.load",
      });

      try {
        // Create a span for the API call
        const span = transaction.startChild({
          op: "http.client",
          description: "Fetch server component data",
        });

        const response = await fetch("/api/slow");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);

        span.setStatus("ok");
        span.finish();
      } catch (error) {
        console.error("Error:", error);
        Sentry.captureException(error, {
          tags: {
            component: "ServerComponent",
          },
        });
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
        transaction.finish();
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded"></div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
        <p className="font-medium">Error:</p>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 p-4 rounded">
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
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
