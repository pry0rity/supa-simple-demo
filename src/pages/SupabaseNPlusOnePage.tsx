import { useState, useEffect } from "react";
import { AlertOctagon, CheckCircle, XCircle } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface Post {
  id: number;
  title: string;
  body: string;
}

interface QueryStats {
  totalTime: number;
  requestCount: number;
  isOptimized?: boolean;
}

interface Request {
  id: string;
  url: string;
  status: "pending" | "success" | "error";
  time?: number;
  startTime: number;
}

export function SupabaseNPlusOnePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);

  // Clear old requests that completed more than 5 seconds ago
  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      setRequests((prev) =>
        prev.filter(
          (req) => req.status === "pending" || now - req.startTime < 5000
        )
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const addRequest = (url: string): string => {
    const id = Math.random().toString(36).substring(2, 9);
    setRequests((prev) => [
      ...prev,
      {
        id,
        url,
        status: "pending",
        startTime: performance.now(),
      },
    ]);
    return id;
  };

  const updateRequest = (
    id: string,
    status: "success" | "error",
    time?: number
  ) => {
    setRequests((prev) =>
      prev.map((req) => (req.id === id ? { ...req, status, time } : req))
    );
  };

  const fetchWithTracking = async <T,>(
    url: string,
    fn: () => Promise<T>
  ): Promise<T> => {
    const requestId = addRequest(url);
    const startTime = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - startTime;
      updateRequest(requestId, "success", duration);
      return result;
    } catch (error) {
      updateRequest(requestId, "error");
      throw error;
    }
  };

  const triggerNPlusOne = async (optimized: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      setPosts([]);
      setQueryStats(null);
      setRequests([]);
      setActiveStep(0);

      const startTotalTime = performance.now();

      if (optimized) {
        // Optimized: Single request for all posts
        setActiveStep(1);

        const allPosts = await fetchWithTracking("GET /posts", () =>
          api.getAllPosts()
        );

        setPosts(allPosts);
        setQueryStats({
          totalTime: performance.now() - startTotalTime,
          requestCount: 1,
          isOptimized: true,
        });
      } else {
        // N+1: Make 20 requests to the same endpoint
        setActiveStep(1);

        // Create all request promises before any execution
        const postPromises = Array(20)
          .fill(null)
          .map(() => fetchWithTracking("GET /posts/1", () => api.getPost(1)));

        // Wait for all to complete
        const posts = await Promise.all(postPromises);
        setPosts(posts);
        setQueryStats({
          totalTime: performance.now() - startTotalTime,
          requestCount: 20,
          isOptimized: false,
        });
      }

      setActiveStep(2);
    } catch (err) {
      console.error("N+1 Query Error:", err);
      Sentry.captureException(err);
      setError(err instanceof Error ? err.message : "Failed to fetch posts");
    } finally {
      setLoading(false);
    }
  };

  const getStepDescription = () => {
    switch (activeStep) {
      case 0:
        return "Ready to demonstrate the N+1 query problem...";
      case 1:
        return queryStats?.isOptimized
          ? "Fetching all posts in a single request..."
          : "Fetching posts one by one (N+1 problem)...";
      case 2:
        return "All data loaded!";
      default:
        return "";
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center mb-6">
        <AlertOctagon className="mr-2 text-red-600" />
        <h2 className="text-2xl font-bold">Supabase N+1 Query Demo</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This demo shows how inefficient database queries can impact your
              application's performance using Supabase. We'll fetch a list of
              posts, comparing two approaches:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-medium text-red-700 mb-2 flex items-center">
                  <XCircle className="w-5 h-5 mr-1" />
                  N+1 Problem
                </h3>
                <p className="text-sm text-gray-700">
                  Makes a separate database request for each individual post.
                  Results in{" "}
                  <span className="font-medium">20 separate requests</span> to
                  the database.
                </p>
                <div className="mt-2 text-xs bg-white p-2 rounded border border-red-100 font-mono">
                  GET /posts/1
                  <br />
                  GET /posts/2
                  <br />
                  GET /posts/3
                  <br />
                  ... and so on
                </div>
              </div>
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-medium text-green-700 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  Optimized Solution
                </h3>
                <p className="text-sm text-gray-700">
                  Fetches all posts in a single database query. Only{" "}
                  <span className="font-medium">1 request</span> total.
                </p>
                <div className="mt-2 text-xs bg-white p-2 rounded border border-green-100 font-mono">
                  GET /posts
                  <br />
                  // Returns all posts at once
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mb-4">
              <button
                onClick={() => triggerNPlusOne(false)}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Trigger N+1 Query (20 requests)"}
              </button>

              <button
                onClick={() => triggerNPlusOne(true)}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Optimized Query (1 request)"}
              </button>
            </div>

            {loading && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full animate-spin"></div>
                  <span>{getStepDescription()}</span>
                </div>
              </div>
            )}

            {queryStats && (
              <div
                className={`p-4 rounded-lg ${
                  queryStats.isOptimized
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <h4 className="font-medium mb-2">Performance Analysis:</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Requests:</p>
                    <p className="text-lg font-medium">
                      {queryStats.requestCount}{" "}
                      {queryStats.isOptimized ? "✅" : "❌"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Time:</p>
                    <p className="text-lg font-medium">
                      {queryStats.totalTime.toFixed(2)}ms
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {error ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          ) : posts.length > 0 ? (
            <div>
              <h3 className="font-medium mb-4">Posts:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.slice(0, 6).map((post) => (
                  <div
                    key={post.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <h4 className="font-medium text-lg">{post.title}</h4>
                    <p className="text-gray-600">
                      {post.body
                        ? post.body.substring(0, 120) + "..."
                        : "No content"}
                    </p>
                  </div>
                ))}
                {posts.length > 6 && (
                  <div className="col-span-2 text-center text-gray-500">
                    ... and {posts.length - 6} more posts
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Live Network Requests Panel */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="font-medium mb-4 flex items-center">
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
              LIVE
            </span>
            Network Requests
          </h3>
          <div className="text-sm space-y-2 max-h-[80vh] overflow-auto">
            {requests.length === 0 ? (
              <p className="text-gray-500 italic">
                No requests yet. Click one of the buttons to start.
              </p>
            ) : (
              requests.map((req) => (
                <div
                  key={req.id}
                  className={`p-3 rounded-lg border ${
                    req.status === "pending"
                      ? "border-blue-200 bg-blue-50"
                      : req.status === "success"
                      ? "border-green-200 bg-green-50"
                      : "border-red-200 bg-red-50"
                  } transition-all duration-300`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs break-all">
                      {req.url}
                    </span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        req.status === "pending"
                          ? "bg-blue-200 text-blue-800"
                          : req.status === "success"
                          ? "bg-green-200 text-green-800"
                          : "bg-red-200 text-red-800"
                      }`}
                    >
                      {req.status === "pending"
                        ? "⏳"
                        : req.status === "success"
                        ? "✓"
                        : "✗"}
                    </span>
                  </div>
                  {req.status === "success" && req.time && (
                    <div className="text-xs text-right font-medium">
                      {req.time.toFixed(2)}ms
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {queryStats && (
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-sm">
                Performance Comparison
              </h4>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="text-xs space-y-2">
                  <div>
                    <p className="font-medium">N+1 Query Approach:</p>
                    <p>20 individual database requests</p>
                    <p>Increased server load</p>
                    <p>Higher latency at scale</p>
                    <p>Will trigger monitoring alerts</p>
                  </div>
                  <div>
                    <p className="font-medium">Optimized Approach:</p>
                    <p>Only 1 database query</p>
                    <p>Reduced server load</p>
                    <p>Better scalability</p>
                    <p>Improved overall performance</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
