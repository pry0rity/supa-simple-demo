import { useState } from "react";
import { AlertOctagon, ArrowRight } from "../components/Icons";
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

export function SupabaseNPlusOnePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);
  const [currentRequests, setCurrentRequests] = useState<string[]>([]);
  const [activeStep, setActiveStep] = useState<number>(0);

  const triggerNPlusOne = async (optimized: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      setPosts([]);
      setQueryStats(null);
      setCurrentRequests([]);
      setActiveStep(0);

      const startTotalTime = performance.now();

      if (optimized) {
        // Optimized: Single request for all posts
        setCurrentRequests((prev) => [...prev, "GET /posts"]);
        setActiveStep(1);
        const allPosts = await api.getAllPosts();
        setPosts(allPosts);
        setQueryStats({
          totalTime: performance.now() - startTotalTime,
          requestCount: 1,
          isOptimized: true,
        });
      } else {
        // N+1: Make all requests simultaneously
        setActiveStep(1);

        // Create all request promises before any execution
        const postIds = Array.from({ length: 20 }, (_, i) => i + 1);
        setCurrentRequests(postIds.map((id) => `GET /posts/${id}`));

        // Start all requests at exactly the same time
        const postPromises = postIds.map((id) => api.getPost(id));

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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center mb-6">
        <AlertOctagon className="mr-2 text-red-600" />
        <h2 className="text-2xl font-bold">Supabase N+1 Query Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            This demo shows how inefficient database queries can impact your
            application's performance using Supabase. We'll fetch a list of
            posts, comparing two approaches:
          </p>
          <ul className="list-disc pl-6 mb-4 space-y-2">
            <li>
              <span className="font-medium">N+1 Problem:</span> Making a
              separate request to Supabase for each post
            </li>
            <li>
              <span className="font-medium">Optimized:</span> Fetching all posts
              from Supabase in a single request
            </li>
          </ul>

          <div className="space-x-4 mb-4">
            <button
              onClick={() => triggerNPlusOne(false)}
              disabled={loading}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Trigger N+1 Query"}
            </button>

            <button
              onClick={() => triggerNPlusOne(true)}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Optimized Query"}
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

          {currentRequests.length > 0 && (
            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium mb-2">Current Requests:</h4>
              <div className="space-y-1 text-sm font-mono">
                {currentRequests.map((request, index) => (
                  <div key={index} className="flex items-center">
                    <ArrowRight className="w-4 h-4 mr-2 text-gray-500" />
                    <span>{request}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {queryStats && (
            <div
              className={`p-4 rounded-lg ${
                queryStats.isOptimized ? "bg-green-50" : "bg-red-50"
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
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-lg">{post.title}</h4>
                  <p className="text-gray-600">{post.body}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
