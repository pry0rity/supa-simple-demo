import React, { useState } from "react";
import { Clock } from "lucide-react";

const SlowApiPage = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const makeSlowRequest = async () => {
    setLoading(true);
    setResponse(null);
    setError(null);

    try {
      const response = await fetch("/api/slow");

      // Check if response is ok and content type is JSON
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error(
          `Invalid content type: ${
            contentType || "none"
          }. Expected application/json`
        );
      }

      const data = await response.json();
      setResponse(data.message);
    } catch (error) {
      console.error("Error:", error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
      setResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Clock className="mr-2 text-blue-600" />
        <h2 className="text-2xl font-bold">Slow API Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <button
          onClick={makeSlowRequest}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Make Slow Request"}
        </button>

        {response && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <p>{response}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SlowApiPage;
