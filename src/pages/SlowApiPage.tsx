import { useState } from "react";
import { Clock, RefreshCw } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

const SlowApiPage = () => {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isFixing, setIsFixing] = useState(false);
  const [showFixButton, setShowFixButton] = useState(false);

  const makeSlowRequest = async (timeout: number = 3) => {
    setLoading(true);
    setResponse(null);
    setError(null);
    setShowFixButton(false);

    try {
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timed out after ${timeout} seconds`));
        }, timeout * 1000);
      });

      const requestPromise = api.getSlowResponse();

      const data = await Promise.race([requestPromise, timeoutPromise]);
      setResponse(data.message);
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
    setResponse(null);
    setShowFixButton(false);

    try {
      const data = await api.getSlowResponse();
      setResponse(data.message);
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
        <h2 className="text-2xl font-bold">Slow API Demo</h2>
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

        {response && (
          <div className="mt-4 p-4 bg-green-50 text-green-700 rounded">
            {response}
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
