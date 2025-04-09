import { useState } from "react";
import { Clock, RefreshCw } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface ApiState {
  loading: boolean;
  data: { message: string } | null;
  responseTime: number | null;
  error: string | null;
  showFixButton: boolean;
}

const SlowApiPage = () => {
  const [state, setState] = useState<ApiState>({
    loading: false,
    data: null,
    responseTime: null,
    error: null,
    showFixButton: false,
  });

  const makeRequest = async () => {
    setState((prev) => ({
      ...prev,
      loading: true,
      data: null,
      responseTime: null,
      error: null,
      showFixButton: false,
    }));

    try {
      const startTime = performance.now();
      const data = await api.getSlowResponse();
      const responseTime = Math.round(performance.now() - startTime);

      setState((prev) => ({
        ...prev,
        loading: false,
        data,
        responseTime,
      }));
    } catch (error) {
      console.error("Error:", error);
      Sentry.captureException(error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "The request took too long to complete.",
        showFixButton: true,
      }));
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
            onClick={() => makeRequest()}
            disabled={state.loading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {state.loading ? "Loading..." : "Make Slow Request"}
          </button>

          {state.showFixButton && (
            <button
              onClick={makeRequest}
              disabled={state.loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
            >
              {state.loading ? (
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

        {state.data && (
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-green-50 text-green-700 rounded">
              <h3 className="font-semibold mb-2">Response:</h3>
              <div className="mb-3">{state.data.message}</div>
              {state.responseTime && (
                <div className="text-sm">
                  Response time: {(state.responseTime / 1000).toFixed(2)}s
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">
                Raw JSON:
              </h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto border border-gray-200">
                {JSON.stringify(state.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {state.error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">
            {state.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default SlowApiPage;
