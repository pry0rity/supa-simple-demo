import React, { useState, useEffect } from "react";
import { Users } from "lucide-react";

const ClientComponentPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/api/custom-attributes");
        const result = await response.json();
        setData(result);
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
