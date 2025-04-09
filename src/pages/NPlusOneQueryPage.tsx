import { useState } from "react";
import { AlertOctagon } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface Post {
  id: number;
  title: string;
  content: string;
  user_id: number;
}

interface UserWithPosts {
  id: number;
  name: string;
  email: string;
  posts: Post[];
}

const NPlusOneQueryPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserWithPosts[]>([]);
  const [queryCount, setQueryCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isOptimized, setIsOptimized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demonstrate N+1 query problem
  const fetchDataWithNPlusOne = async () => {
    setLoading(true);
    setResults([]);
    setQueryCount(0);
    setTotalTime(0);
    setIsOptimized(false);
    setError(null);

    const startTime = performance.now();

    await Sentry.startSpan(
      {
        name: "NPlusOneQuery.problem",
        op: "navigation",
      },
      async () => {
        try {
          console.log("Fetching data with N+1 pattern...");
          const data = await api.getUsersWithPosts();
          console.log("Received data:", data);

          const endTime = performance.now();

          if (!Array.isArray(data)) {
            throw new Error("Expected array of users with posts");
          }

          setResults(data);
          setQueryCount(data.length + 1); // 1 for users query + N for posts queries
          setTotalTime(Math.round(endTime - startTime));
        } catch (error) {
          console.error("Error in N+1 demo:", error);
          Sentry.captureException(error);
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

  // Demonstrate optimized solution
  const fetchDataWithJoin = async () => {
    setLoading(true);
    setResults([]);
    setQueryCount(0);
    setTotalTime(0);
    setIsOptimized(true);
    setError(null);

    const startTime = performance.now();

    await Sentry.startSpan(
      {
        name: "NPlusOneQuery.optimized",
        op: "navigation",
      },
      async () => {
        try {
          const data = await api.getUsersWithPostsOptimized();
          const endTime = performance.now();

          setResults(data);
          setQueryCount(1); // Only one optimized query
          setTotalTime(Math.round(endTime - startTime));
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
      }
    );
  };

  return (
    <div className="max-w-2xl mx-auto overflow-hidden">
      <div className="flex items-center mb-6">
        <AlertOctagon className="flex-shrink-0 mr-2 text-amber-600" />
        <h2 className="text-2xl font-bold truncate">N+1 Query Problem</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6 overflow-hidden">
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            The N+1 query problem occurs when fetching a list of items and their
            related data. Instead of using joins or batch queries, code makes 1
            query to get the main entities plus N additional queries (one for
            each entity) to get related data.
          </p>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={fetchDataWithNPlusOne}
              disabled={loading}
              className="bg-amber-500 text-white px-4 py-2 rounded hover:bg-amber-600 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Demonstrate N+1 Problem"}
            </button>

            <button
              onClick={fetchDataWithJoin}
              disabled={loading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Optimized Solution"}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded border border-red-200 mb-4">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-4">
            <div
              className={`p-4 rounded ${
                isOptimized
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">
                  {isOptimized
                    ? "Optimized Query Results"
                    : "N+1 Query Results"}
                </h3>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs py-1 px-2 rounded-full ${
                      isOptimized
                        ? "bg-green-200 text-green-800"
                        : "bg-amber-200 text-amber-800"
                    }`}
                  >
                    {queryCount} {queryCount === 1 ? "query" : "queries"}
                  </span>
                  <span
                    className={`text-xs py-1 px-2 rounded-full ${
                      isOptimized
                        ? "bg-green-200 text-green-800"
                        : "bg-amber-200 text-amber-800"
                    }`}
                  >
                    {totalTime}ms
                  </span>
                </div>
              </div>

              {results.map((result) => (
                <div
                  key={result.id}
                  className="bg-white rounded p-4 mb-4 last:mb-0"
                >
                  <div className="mb-2">
                    <h4 className="font-medium">{result.name}</h4>
                    <p className="text-sm opacity-75">{result.email}</p>
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">
                      Posts ({result.posts.length})
                    </h5>
                    {result.posts.map((post) => (
                      <div
                        key={post.id}
                        className="pl-4 border-l-2 border-gray-200"
                      >
                        <p className="text-sm">{post.title}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NPlusOneQueryPage;
