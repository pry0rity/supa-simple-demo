import { useState, useEffect } from "react";
import { Users } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

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
      return Sentry.startSpan(
        {
          name: 'client.fetchUserData',
          op: 'client.effect',
          description: 'Fetch user data in client component',
        },
        async (span) => {
          try {
            // This API call is automatically instrumented by Sentry
            const result = await api.getUserAttributes();
            setData(result);
          } catch (error) {
            console.error("Error:", error);
            // Associate the error with current span
            span?.setStatus('error');
            span?.setData('error', error instanceof Error ? error.message : String(error));
            Sentry.captureException(error, {
              mechanism: {
                type: 'client_error',
                handled: true
              }
            });
            setError(
              error instanceof Error
                ? error.message
                : "An unexpected error occurred"
            );
          } finally {
            setLoading(false);
          }
        }
      );
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
            {/* Formatted display */}
            <div className="p-4 bg-teal-50 text-teal-700 rounded">
              <h3 className="font-semibold mb-3">User Profile</h3>
              
              <div className="mb-5 flex items-center">
                <div className="w-12 h-12 rounded-full bg-teal-500 text-white flex items-center justify-center font-bold mr-4">
                  {data?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <div className="font-medium text-lg">{data?.name}</div>
                  <div className="text-sm text-teal-600">{data?.email}</div>
                </div>
              </div>
              
              <div className="border-t border-teal-100 pt-3">
                <h4 className="text-sm font-medium mb-2">User Preferences</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm">
                    <span className="text-teal-500">Theme:</span> {data?.preferences?.theme}
                  </div>
                  <div className="text-sm">
                    <span className="text-teal-500">Language:</span> {data?.preferences?.language}
                  </div>
                  <div className="text-sm col-span-2">
                    <span className="text-teal-500">Notifications:</span> {data?.preferences?.notifications ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Raw JSON */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">Raw JSON:</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto border border-gray-200">
                {JSON.stringify(data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientComponentPage;
