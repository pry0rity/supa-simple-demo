import React, { Suspense } from "react";
import { Server } from "lucide-react";

interface ServerData {
  message: string;
}

// Simulated Server Component
const SlowServerComponent = () => {
  const [data, setData] = React.useState<ServerData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadData = async () => {
      // Simulate slow server-side rendering
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setData({ message: "Server Component Data Loaded" });
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-20 rounded"></div>;
  }

  return (
    <div className="bg-gray-50 p-4 rounded">
      <pre className="whitespace-pre-wrap">{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

const ServerComponentPage = () => {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Server className="mr-2 text-orange-600" />
        <h2 className="text-2xl font-bold">Server Component Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <Suspense
          fallback={
            <div className="animate-pulse bg-gray-200 h-20 rounded"></div>
          }
        >
          <SlowServerComponent />
        </Suspense>
      </div>
    </div>
  );
};

export default ServerComponentPage;
