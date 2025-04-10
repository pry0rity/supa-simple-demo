import { useState } from "react";
import { AlertOctagon } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

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

export function NPlusOneQueryDebugPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [requestCount, setRequestCount] = useState(0);
  const [queryStats, setQueryStats] = useState<QueryStats | null>(null);

  const triggerNPlusOne = async (optimized: boolean = false) => {
    try {
      setLoading(true);
      setError(null);
      setPosts([]);
      setRequestCount(0);
      setQueryStats(null);

      const startTotalTime = performance.now();

      // First, get post 1
      const startPostsQuery = performance.now();
      const post = await api.getExternalPost(1);
      const postsQueryTime = performance.now() - startPostsQuery;

      // Create an array of 10 copies of the same post
      const repeatedPosts = Array(10).fill({ ...post });

      let postsWithComments: Post[];
      const commentQueryTimes: { postId: number; time: number }[] = [];

      if (optimized) {
        // Fetch comments once and reuse
        const startCommentQuery = performance.now();
        const comments = await api.getExternalComments(1);
        const commentQueryTime = performance.now() - startCommentQuery;

        // Use the same comments for all posts
        postsWithComments = repeatedPosts.map((post: Post) => ({
          ...post,
          comments: comments,
        }));

        commentQueryTimes.push({ postId: 1, time: commentQueryTime });
        setRequestCount(1); // Only one query for all comments
      } else {
        // Original N+1 query approach - fetch the same comments multiple times
        postsWithComments = await Promise.all(
          repeatedPosts.map(async (post: Post) => {
            const startCommentQuery = performance.now();
            const comments = await api.getExternalComments(1);
            const commentQueryTime = performance.now() - startCommentQuery;
            commentQueryTimes.push({ postId: 1, time: commentQueryTime });
            setRequestCount((prev) => prev + 1);
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
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <AlertOctagon className="mr-2 text-red-600" />
        <h2 className="text-2xl font-bold">
          N+1 Query Debug Demo (Same Endpoint)
        </h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            This demo triggers an N+1 query problem by fetching the same post's
            comments 10 times. This helps debug N+1 detection by ensuring we're
            hitting the exact same endpoint repeatedly. Click the "Optimized
            Query" button to see how this can be fixed by reusing the comment
            data.
          </p>

          <div className="space-x-4">
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

          {queryStats && (
            <div
              className={`mt-4 p-4 rounded-lg ${
                queryStats.isOptimized ? "bg-green-50" : "bg-red-50"
              }`}
            >
              <h4 className="font-medium mb-2">Query Statistics:</h4>
              <div className="space-y-1 text-sm">
                <p>
                  Total Queries:{" "}
                  <span className="font-medium">{requestCount + 1}</span> (1 for
                  post + {requestCount} for comments)
                </p>
                <p>
                  Total Time:{" "}
                  <span className="font-medium">
                    {queryStats.totalTime.toFixed(2)}ms
                  </span>
                </p>
                <p>
                  Posts Query:{" "}
                  <span className="font-medium">
                    {queryStats.postsQueryTime.toFixed(2)}ms
                  </span>
                </p>
                <p>
                  Comments Query{queryStats.isOptimized ? "" : "s (avg)"}:{" "}
                  <span className="font-medium">
                    {queryStats.isOptimized
                      ? queryStats.commentQueries[0].time.toFixed(2)
                      : (
                          queryStats.commentQueries.reduce(
                            (acc, q) => acc + q.time,
                            0
                          ) / queryStats.commentQueries.length
                        ).toFixed(2)}
                    ms
                  </span>
                </p>
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
            <h3 className="font-medium mb-4">Posts and Their Comments:</h3>
            <div className="space-y-6">
              {posts.map((post, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <h4 className="font-medium text-lg mb-2">{post.title}</h4>
                  <p className="text-gray-600 mb-4">{post.body}</p>
                  <div className="pl-4 border-l-2 border-gray-200">
                    <h5 className="text-sm font-medium text-gray-500 mb-2">
                      Comments ({post.comments?.length || 0}):
                    </h5>
                    <div className="space-y-2">
                      {post.comments?.slice(0, 3).map((comment) => (
                        <div key={comment.id} className="text-sm">
                          <div className="font-medium">{comment.name}</div>
                          <div className="text-gray-500">{comment.email}</div>
                          <div className="text-gray-600">{comment.body}</div>
                        </div>
                      ))}
                      {(post.comments?.length || 0) > 3 && (
                        <p className="text-sm text-gray-500">
                          ...and {(post.comments?.length || 0) - 3} more
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
    </div>
  );
}
