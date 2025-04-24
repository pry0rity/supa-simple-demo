import { useState, useEffect } from "react";
import { AlertOctagon, CheckCircle, XCircle } from "../components/Icons";
import * as Sentry from "@sentry/react";

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
  comments?: Comment[];
}

interface QueryStats {
  totalTime: number;
  postsQueryTime: number;
  commentQueries: { postId: number; time: number }[];
  isOptimized?: boolean;
}

interface Request {
  id: string;
  url: string;
  status: "pending" | "success" | "error";
  time?: number;
  startTime: number;
}

export function JsonPlaceholderNPlusOnePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);

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

  const loadRealPosts = async (optimized: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      setPosts([]);
      setQueryStats(null);
      setRequests([]);

      const startTotalTime = performance.now();
      const REPEAT_COUNT = 11; // Number of identical requests to trigger Sentry

      // First, get a single post from JSONPlaceholder
      const startPostsQuery = performance.now();
      const singlePost = await fetchWithTracking("GET /posts/1", () =>
        fetch("https://jsonplaceholder.typicode.com/posts/1").then((res) =>
          res.json()
        )
      );
      const postsQueryTime = performance.now() - startPostsQuery;

      // Create 11 copies of the same post to simulate a component rendering the same post multiple times
      // This simulates a UI with multiple components that all need the same data but don't share state
      const repeatedPosts = Array(REPEAT_COUNT)
        .fill(null)
        .map((_, index) => ({
          ...singlePost,
          id: singlePost.id,
          simulatedInstanceId: index + 1, // Just to distinguish between instances in our UI
        }));

      const commentQueryTimes: { postId: number; time: number }[] = [];
      let postsWithComments: Post[];

      if (optimized) {
        // Optimized approach: get comments once and reuse for all instances
        const startCommentQuery = performance.now();
        const comments = await fetchWithTracking("GET /posts/1/comments", () =>
          fetch("https://jsonplaceholder.typicode.com/posts/1/comments").then(
            (res) => res.json()
          )
        );
        const commentQueryTime = performance.now() - startCommentQuery;
        commentQueryTimes.push({ postId: 1, time: commentQueryTime });

        // Reuse the same comments for all post instances (proper caching/state management)
        postsWithComments = repeatedPosts.map((post: Post) => ({
          ...post,
          comments,
        }));
      } else {
        // N+1 Query Anti-pattern: make the exact same request multiple times
        // This simulates components that don't share state and each make their own API call
        postsWithComments = await Promise.all(
          repeatedPosts.map(async (post: Post, index) => {
            const startCommentQuery = performance.now();
            // Same endpoint called 11 times!
            const comments = await fetchWithTracking(
              `GET /posts/1/comments (instance ${index + 1})`,
              () =>
                fetch(
                  "https://jsonplaceholder.typicode.com/posts/1/comments"
                ).then((res) => res.json())
            );
            const commentQueryTime = performance.now() - startCommentQuery;
            commentQueryTimes.push({ postId: 1, time: commentQueryTime });
            return { ...post, comments };
          })
        );
      }

      const totalTime = performance.now() - startTotalTime;
      setQueryStats({
        totalTime,
        postsQueryTime,
        commentQueries: commentQueryTimes,
        isOptimized: optimized,
      });
      setPosts(postsWithComments);
    } catch (err) {
      console.error("N+1 Query Error:", err);
      Sentry.captureException(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to fetch posts and comments"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center mb-6">
        <AlertOctagon className="mr-2 text-red-600" />
        <h2 className="text-2xl font-bold">
          JSONPlaceholder Duplicate Requests Demo
        </h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white shadow rounded-lg p-6 lg:col-span-2">
          <div className="mb-6">
            <p className="text-gray-700 mb-4">
              This demo shows how inefficient API calls can impact your
              application's performance using the JSONPlaceholder API. We'll
              fetch posts and their comments, comparing two approaches:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h3 className="font-medium text-red-700 mb-2 flex items-center">
                  <XCircle className="w-5 h-5 mr-1" />
                  Duplicate Requests Problem
                </h3>
                <p className="text-sm text-gray-700">
                  Multiple components request the exact same data repeatedly,
                  making
                  <span className="font-medium"> 11 identical requests</span> to
                  the same endpoint. Common in UIs with poor state management.
                </p>
                <div className="mt-2 text-xs bg-white p-2 rounded border border-red-100 font-mono">
                  GET /posts/1
                  <br />
                  GET /posts/1/comments (instance 1)
                  <br />
                  GET /posts/1/comments (instance 2)
                  <br />
                  GET /posts/1/comments (instance 3)
                  <br />
                  ... (repeated 11 times!)
                </div>
              </div>
              <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                <h3 className="font-medium text-green-700 mb-2 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-1" />
                  Optimized Solution
                </h3>
                <p className="text-sm text-gray-700">
                  Fetches the data once and reuses it across all components that
                  need it. Only <span className="font-medium">2 requests</span>{" "}
                  total (1 for post, 1 for comments).
                </p>
                <div className="mt-2 text-xs bg-white p-2 rounded border border-green-100 font-mono">
                  GET /posts/1
                  <br />
                  GET /posts/1/comments
                  <br />
                  // Then reuse across components
                </div>
              </div>
            </div>

            <div className="space-x-4 mb-6">
              <button
                onClick={() => loadRealPosts(false)}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Run Duplicate Requests (11 calls)"}
              </button>

              <button
                onClick={() => loadRealPosts(true)}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Run Optimized Query (2 calls)"}
              </button>
            </div>

            {queryStats && (
              <div
                className={`p-4 rounded-lg ${
                  queryStats.isOptimized
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                <h4 className="font-medium mb-2">Query Statistics:</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="font-medium">Total Queries:</span>{" "}
                    {queryStats.isOptimized
                      ? 2
                      : queryStats.commentQueries.length + 1}{" "}
                    (
                    {queryStats.isOptimized
                      ? "1 posts + 1 all comments"
                      : `1 posts + ${queryStats.commentQueries.length} individual comment queries`}
                    )
                  </p>
                  <p>
                    <span className="font-medium">Total Time:</span>{" "}
                    {queryStats.totalTime.toFixed(2)}ms
                  </p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="font-medium">Initial Posts Query:</p>
                      <p className="text-sm">
                        {queryStats.postsQueryTime.toFixed(2)}ms
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Comments Queries:</p>
                      <p className="text-sm">
                        {queryStats.isOptimized
                          ? `${queryStats.commentQueries[0].time.toFixed(
                              2
                            )}ms (1 query)`
                          : `${queryStats.commentQueries
                              .reduce((acc, q) => acc + q.time, 0)
                              .toFixed(2)}ms (${
                              queryStats.commentQueries.length
                            } queries)`}
                      </p>
                    </div>
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
              <h3 className="font-medium mb-4">Posts with Comments:</h3>
              <div className="space-y-6">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    className="border rounded-lg p-4 bg-gray-50"
                  >
                    <h4 className="font-medium text-lg mb-2">
                      Post #{post.id}: {post.title}
                    </h4>
                    <p className="text-gray-600 mb-4">{post.body}</p>
                    <div className="pl-4 border-l-2 border-gray-200">
                      <h5 className="text-sm font-medium text-gray-500 mb-2">
                        Comments ({post.comments?.length || 0}):
                      </h5>
                      <div className="space-y-2">
                        {post.comments?.slice(0, 2).map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <div className="font-medium">{comment.name}</div>
                            <div className="text-gray-500">{comment.email}</div>
                            <div className="text-gray-600">
                              {comment.body
                                ? comment.body.substring(0, 100) + "..."
                                : "No content"}
                            </div>
                          </div>
                        ))}
                        {(post.comments?.length || 0) > 2 && (
                          <p className="text-sm text-gray-500">
                            ...and {(post.comments?.length || 0) - 2} more
                            comments
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

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
                    <span className="font-mono text-xs">{req.url}</span>
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
                    <p className="font-medium">Duplicate Requests Problem:</p>
                    <p>11 identical calls to /posts/1/comments</p>
                    <p>Wasted bandwidth and server resources</p>
                    <p>Will trigger monitoring alerts (like Sentry)</p>
                    <p>Slower page load times</p>
                  </div>
                  <div>
                    <p className="font-medium">Optimized Approach:</p>
                    <p>Only 2 requests total</p>
                    <p>Proper caching/state management</p>
                    <p>Better user experience</p>
                    <p>No monitoring alerts</p>
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
