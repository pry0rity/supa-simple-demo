import React, { useState } from "react";
import { Layers } from "lucide-react";

const BatchRequestsPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const performBatchRequests = async () => {
    setLoading(true);
    setResults([]);

    try {
      const response = await fetch("/api/batch");
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
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
