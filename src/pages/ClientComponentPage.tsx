import React, { useState, useEffect } from "react";
import { Users } from "../components/Icons";
import * as Sentry from "@sentry/react";

interface UserData {
  id: number;
  name: string;
  email: string;
  preferences: {
    theme: string;
    notifications: boolean;
    language: string;
  };
}

const ClientComponentPage = () => {
  const [data, setData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/custom-attributes");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(
            `Invalid content type: ${
              contentType || "none"
            }. Expected application/json`
          );
        }

        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error("Error:", error);
        Sentry.captureException(error);
        setError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Users className="mr-2 text-teal-600" />
        <h2 className="text-2xl font-bold">Client Component Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {loading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">User Data</h3>
            <pre className="bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientComponentPage;
