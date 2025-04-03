import React, { useState } from "react";
import { Database } from "lucide-react";

interface DbResult {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const DbQueryPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DbResult[] | null>(null);

  const performQuery = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/db");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      setResult(null);
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

        {result && (
          <div className="mt-4 p-4 bg-gray-50 rounded">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default DbQueryPage;
