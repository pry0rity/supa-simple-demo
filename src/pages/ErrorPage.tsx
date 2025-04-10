import { useState } from "react";
import { AlertTriangle } from "../components/Icons";
import * as Sentry from "@sentry/react";

const ErrorPage = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = () => {
    Sentry.startSpan(
      {
        name: "ErrorPage.triggerError",
        op: "error.demo",
      },
      () => {
        try {
          throw new Error("This is your first error!");
        } catch (err) {
          setError(
            err instanceof Error ? err.message : "An unexpected error occurred"
          );
          console.error("Caught error:", err);
          
          // Report to Sentry
          Sentry.captureException(err);
        }
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <AlertTriangle className="mr-2 text-red-600" />
        <h2 className="text-2xl font-bold">Trigger Upstream Error</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <button
          onClick={handleError}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
        >
          Trigger Error
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
            <p className="font-medium">Caught Error:</p>
            <p>{error}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
