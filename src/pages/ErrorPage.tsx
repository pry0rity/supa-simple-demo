import { useState } from "react";
import { AlertTriangle, Server, Cpu } from "../components/Icons";
import * as Sentry from "@sentry/react";

const ErrorPage = () => {
  const [error, setError] = useState<{
    message: string;
    source: "client" | "server";
  } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleClientError = () => {
    const err = new Error("A client-side error occurred");
    console.error("Client error triggered:", err);
    setError({
      message: err.message,
      source: "client",
    });
    Sentry.captureException(err);
  };

  const handleServerError = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://localhost:3000/api/debug-sentry");

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
    } catch (err) {
      console.error("Error occurred:", err);
      setError({
        message: "Something went wrong",
        source: "server",
      });
      Sentry.captureException(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <AlertTriangle className="mr-2 text-red-600" />
        <h2 className="text-2xl font-bold">Trigger Upstream Error</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="mb-4 text-gray-700">
          This page demonstrates how errors are captured and reported to Sentry
          from different sources. Select one of the buttons below to trigger a
          demonstration error.
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-center mb-3">
              <Cpu className="mr-2 h-5 w-5 text-orange-600" />
              <h3 className="font-medium">Client-Side Error</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Triggers an error in your browser's JavaScript code. The error is
              caught, displayed below, and reported to Sentry.
            </p>
            <button
              onClick={handleClientError}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 flex items-center justify-center"
              disabled={loading}
            >
              <Cpu className="mr-2 h-5 w-5" />
              Trigger Client Error
            </button>
          </div>

          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center mb-3">
              <Server className="mr-2 h-5 w-5 text-red-600" />
              <h3 className="font-medium">Server-Side Error</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Makes an API request that will fail on the backend server. The
              error is caught, displayed below, and reported to Sentry from both
              client and server.
            </p>
            <button
              onClick={handleServerError}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center"
              disabled={loading}
            >
              <Server className="mr-2 h-5 w-5" />
              Trigger Server Error
              {loading && <span className="ml-2 animate-pulse">...</span>}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Error Details</h3>
            <div
              className={`p-5 rounded-lg border-2 ${
                error.source === "client"
                  ? "bg-orange-50 border-orange-300"
                  : "bg-red-50 border-red-300"
              }`}
            >
              <div className="flex items-center mb-3">
                {error.source === "client" ? (
                  <Cpu className="mr-2 h-6 w-6 text-orange-600" />
                ) : (
                  <Server className="mr-2 h-6 w-6 text-red-600" />
                )}
                <h4 className="text-lg font-bold">
                  {error.source === "client"
                    ? "CLIENT ERROR CAPTURED"
                    : "SERVER ERROR CAPTURED"}
                </h4>
              </div>
              <p className="ml-8">{error.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
