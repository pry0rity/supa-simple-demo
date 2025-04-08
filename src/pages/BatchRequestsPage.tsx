import { useState } from "react";
import { Layers } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

const BatchRequestsPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const performBatchRequests = async () => {
    setLoading(true);
    setResults([]);
    setError(null);

    await Sentry.startSpan(
      {
        name: "BatchRequestsPage",
        op: "batch.requests",
      },
      async (span) => {
        try {
          const data = await api.getBatchResults();
          setResults(data);
          span?.setStatus('ok');
        } catch (error) {
          console.error("Error:", error);
          span?.setStatus('error');
          Sentry.captureException(error);
          setError(
            error instanceof Error ? error.message : "An unexpected error occurred"
          );
        } finally {
          setLoading(false);
        }
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Layers className="mr-2 text-purple-600" />
        <h2 className="text-2xl font-bold">Batch Requests Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <button
          onClick={performBatchRequests}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:opacity-50"
        >
          {loading ? "Processing..." : "Start Batch Requests"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 space-y-2">
            {results.map((result, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchRequestsPage;
