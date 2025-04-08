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
      await Sentry.startSpan(
        {
          name: "ServerComponentPage",
          op: "component.load",
        },
        async (span) => {
          try {
            // Create a child span for the API call
            const result = await Sentry.startSpan(
              {
                name: "fetch-server-data",
                op: "http.client",
                description: "Fetch server component data",
              },
              async (childSpan) => {
                const response = await fetch("/api/slow");
                if (!response.ok) {
                  childSpan?.setStatus('error');
                  throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                childSpan?.setStatus('ok');
                return await response.json();
              }
            );
            
            setData(result);
            span?.setStatus('ok');
          } catch (error) {
            console.error("Error:", error);
            span?.setStatus('error');
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
          }
        }
      );
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

  // Add timestamp for display if not provided in the data
  const timestamp = data?.timestamp || new Date().toISOString();
  
  return (
    <div className="space-y-4">
      {/* Formatted display */}
      <div className="p-4 bg-orange-50 text-orange-700 rounded">
        <h3 className="font-semibold mb-3">Server Response</h3>
        
        <div className="mb-4 p-3 bg-white rounded shadow-sm border border-orange-100">
          <div className="text-lg">{data?.message}</div>
          <div className="text-xs text-orange-500 mt-2">
            Timestamp: {new Date(timestamp).toLocaleString()}
          </div>
        </div>
        
        <div className="text-sm bg-orange-100 p-2 rounded">
          <strong>Note:</strong> This component retrieves data from the server when it loads.
        </div>
      </div>
      
      {/* Raw JSON */}
      <div>
        <h3 className="font-semibold mb-2 text-sm text-gray-600">Raw JSON:</h3>
        <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto border border-gray-200">
          {JSON.stringify(data, null, 2)}
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
