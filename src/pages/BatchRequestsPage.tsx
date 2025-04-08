import { useState } from "react";
import { Layers } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface BatchItem {
  id: number;
  message: string;
  processingTime: number;
  timestamp: string;
}

interface BatchResponseData {
  items: BatchItem[];
  totalTime: number;
  success: boolean;
}

const BatchRequestsPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const [responseData, setResponseData] = useState<BatchResponseData | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performBatchRequests = async () => {
    setLoading(true);
    setResults([]);
    setResponseData(null);
    setResponseTime(null);
    setError(null);

    try {
      const startTime = performance.now();
      
      // This API call is automatically instrumented by Sentry
      const data = await api.getBatchResults();
      
      const endTime = performance.now();
      const elapsed = endTime - startTime;
      
      // Store the raw response
      setResults(data);
      setResponseTime(Math.round(elapsed));
      
      // Create a structured response with additional metadata
      // This transforms the array of strings into a more structured format
      const batchItems = data.map((item: string, index: number) => {
        const match = item.match(/Batch item (\d+) processed in (\d+)ms/);
        const itemId = match ? parseInt(match[1]) : index + 1;
        const processingTime = match ? parseInt(match[2]) : 0;
        
        return {
          id: itemId,
          message: item,
          processingTime: processingTime,
          timestamp: new Date().toISOString()
        };
      });
      
      setResponseData({
        items: batchItems,
        totalTime: Math.round(elapsed),
        success: true
      });
    } catch (error) {
      console.error("Error:", error);
      Sentry.captureException(error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
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

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {responseData && (
          <div className="mt-4 space-y-4">
            {/* Formatted display */}
            <div className="p-4 bg-purple-50 text-purple-700 rounded">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Batch Process Results:</h3>
                {responseTime && (
                  <span className="text-xs bg-purple-200 text-purple-800 py-1 px-2 rounded-full">
                    {responseTime}ms
                  </span>
                )}
              </div>

              <div className="flex items-center mb-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full"
                    style={{ width: `100%` }}
                  ></div>
                </div>
                <div className="ml-2 text-sm font-medium">
                  {responseData.totalTime / 1000}s
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                {responseData.items.map((item) => (
                  <div key={item.id} className="bg-white p-3 rounded-md shadow-sm border border-purple-100">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold mr-3">
                        {item.id}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">Batch Item {item.id}</div>
                        <div className="text-sm mt-1">{item.message}</div>
                      </div>
                      <div className="text-sm font-mono bg-purple-100 px-2 py-1 rounded">
                        {item.processingTime}ms
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-xs text-purple-600 mt-3 pt-2 border-t border-purple-100">
                Successfully processed {responseData.items.length} batch items
              </div>
            </div>
            
            {/* Raw JSON */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">Raw JSON:</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto break-words border border-gray-200 max-w-full">
                {JSON.stringify(
                  {
                    batchProcess: {
                      ...responseData,
                      _metadata: {
                        responseTime: responseTime ? `${responseTime}ms` : 'Not measured',
                        timestamp: new Date().toISOString()
                      }
                    },
                    rawResponse: results
                  }, 
                  null, 
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchRequestsPage;
