import { useState } from "react";
import { Clock, RefreshCw } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface SlowApiResponse {
  message: string;
  [key: string]: unknown; // For any additional fields that might be present
}

const SlowApiPage = () => {
  const [loading, setLoading] = useState(false);
  const [responseData, setResponseData] = useState<SlowApiResponse | null>(
    null
  );
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [showFixButton, setShowFixButton] = useState(false);

  const makeSlowRequest = async (timeout: number = 3) => {
    setLoading(true);
    setResponseData(null);
    setResponseTime(null);
    setError(null);
    setShowFixButton(false);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timed out after ${timeout} seconds`));
        }, timeout * 1000);
      });

      const startTime = performance.now();

      // This API call is automatically instrumented by Sentry
      const requestPromise = api.getSlowResponse();

      const data = await Promise.race([requestPromise, timeoutPromise]);
      const endTime = performance.now();
      const elapsed = endTime - startTime;

      setResponseData(data);
      setResponseTime(Math.round(elapsed));
    } catch (error) {
      console.error("Error:", error);
      Sentry.captureException(error);
      setError("The request took too long to complete.");
      setShowFixButton(true);
    } finally {
      setLoading(false);
    }
  };

  const fixTimeout = async () => {
    setIsFixing(true);
    setError(null);
    setResponseData(null);
    setResponseTime(null);
    setShowFixButton(false);

    try {
      const startTime = performance.now();

      // This API call is automatically instrumented by Sentry
      const data = await api.getSlowResponse();

      const endTime = performance.now();
      const elapsed = endTime - startTime;

      setResponseData(data);
      setResponseTime(Math.round(elapsed));
    } catch (error) {
      console.error("Error:", error);
      Sentry.captureException(error);
      setError("Failed to fix the timeout. Please try again.");
      setShowFixButton(true);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Clock className="mr-2 text-blue-600" />
        <h2 className="text-2xl font-bold">Local Server API Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex gap-4">
          <button
            onClick={() => makeSlowRequest()}
            disabled={loading || isFixing}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Make Slow Request"}
          </button>

          {showFixButton && (
            <button
              onClick={fixTimeout}
              disabled={loading || isFixing}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {isFixing ? (
                <>
                  <RefreshCw className="animate-spin" />
                  Fixing...
                </>
              ) : (
                "Fix Timeout"
              )}
            </button>
          )}
        </div>

        {responseData && (
          <div className="mt-4 space-y-4">
            {/* Formatted display */}
            <div className="p-4 bg-green-50 text-green-700 rounded">
              <h3 className="font-semibold mb-2">Response:</h3>
              <div className="mb-3">{responseData.message}</div>

              {responseTime && (
                <div className="flex items-center space-x-2 mb-1">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.min(100, (responseTime / 3000) * 100)}%`,
                      }}
                    ></div>
                  </div>
                  <div className="text-sm font-medium">
                    {(responseTime / 1000).toFixed(2)}s
                  </div>
                </div>
              )}

              <div className="text-xs text-green-600 mt-1">
                {responseTime
                  ? `Exact response time: ${responseTime}ms`
                  : "Response time not measured"}
              </div>
            </div>

            {/* Raw JSON */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">
                Raw JSON:
              </h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto border border-gray-200">
                {JSON.stringify(
                  {
                    ...responseData,
                    _metadata: {
                      responseTime: responseTime
                        ? `${responseTime}ms`
                        : "Not measured",
                      timestamp: new Date().toISOString(),
                    },
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>
        )}
      </div>
    </div>
  );
};

export default SlowApiPage;
