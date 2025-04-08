import { useState } from "react";
import { Database } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface DbResult {
  id: number;
  name: string | null;
  email: string;
  created_at: string;
}

const DbQueryPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DbResult[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performQuery = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // This fetch call is automatically instrumented by Sentry
      const data = await api.getUsers();
      setResult(data);
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Database className="mr-2 text-green-600" />
        <h2 className="text-2xl font-bold">Database Query Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <button
          onClick={performQuery}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
        >
          {loading ? "Querying..." : "Run Query"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded">{error}</div>
        )}

        {result && (
          <div className="mt-4 space-y-4">
            {/* Formatted display */}
            <div className="p-4 bg-green-50 text-green-700 rounded">
              <h3 className="font-semibold mb-2">Database Query Results:</h3>
              <div className="overflow-auto">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">ID</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {result.map((user) => (
                      <tr key={user.id}>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{user.id}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{user.name || '-'}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{user.email}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm">{new Date(user.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-xs text-green-600 mt-2">
                Retrieved {result.length} records
              </div>
            </div>
            
            {/* Raw JSON */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">Raw JSON:</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto border border-gray-200">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DbQueryPage;
