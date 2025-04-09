import { useState } from "react";
import { AlertOctagon } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
}

interface PostWithComments {
  id: number;
  title: string;
  body: string;
  userId: number;
  comments: Comment[];
}

const NPlusOneQueryPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PostWithComments[]>([]);
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

          // First, fetch all post IDs (1 query)
          const postIds = await api.getPostIds();
          console.log("Received post IDs:", postIds);

          // Then, for each post ID:
          // 1. Fetch the post details (N queries)
          // 2. Fetch the post's comments (N queries)
          const postsWithComments = await Promise.all(
            postIds.map(async (postId: number) => {
              const post = await api.getPost(postId);
              const comments = await api.getPostComments(postId);
              return { ...post, comments };
            })
          );

          const endTime = performance.now();

          setResults(postsWithComments);
          // 1 query for post IDs + N queries for posts + N queries for comments
          setQueryCount(1 + postIds.length * 2);
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
          // Fetch posts and comments in parallel
          const [posts, allComments] = await Promise.all([
            api.getPosts(),
            api.getAllComments(),
          ]);

          // Group comments by postId
          const commentsByPostId = allComments.reduce(
            (acc: Record<number, Comment[]>, comment: Comment) => {
              if (!acc[comment.postId]) {
                acc[comment.postId] = [];
              }
              acc[comment.postId].push(comment);
              return acc;
            },
            {} as Record<number, Comment[]>
          );

          // Combine posts with their comments
          const postsWithComments = posts.map((post: Post) => ({
            ...post,
            comments: commentsByPostId[post.id] || [],
          }));

          const endTime = performance.now();

          setResults(postsWithComments);
          setQueryCount(2); // Only two queries: one for posts, one for all comments
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
            related data. In this example, we make:
          </p>
          <ul className="list-disc pl-5 mb-4 text-gray-700">
            <li>1 query to get all post IDs</li>
            <li>N queries to fetch each post's details</li>
            <li>N queries to fetch each post's comments</li>
          </ul>
          <p className="text-gray-700 mb-4">
            The optimized version uses just 2 queries total to fetch the same
            data.
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

              <div className="space-y-4">
                {results.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded p-4 mb-4 last:mb-0 border border-gray-200"
                  >
                    <div className="mb-3">
                      <h4 className="font-medium text-lg">{post.title}</h4>
                      <p className="text-gray-600">{post.body}</p>
                    </div>

                    <div className="mt-4">
                      <h5 className="font-medium text-sm text-gray-500 mb-2">
                        Comments ({post.comments.length})
                      </h5>
                      <div className="space-y-2">
                        {post.comments.map((comment) => (
                          <div
                            key={comment.id}
                            className="bg-gray-50 p-3 rounded"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">
                                {comment.name}
                              </span>
                              <span className="text-gray-500 text-sm">
                                ({comment.email})
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {comment.body}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NPlusOneQueryPage;
