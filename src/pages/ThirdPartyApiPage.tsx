import { useState } from "react";
import { Globe, MessageCircle } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

interface Comment {
  postId: number;
  id: number;
  name: string;
  email: string;
  body: string;
}

const ThirdPartyApiPage = () => {
  const [loading, setLoading] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postId, setPostId] = useState(1);
  const [postData, setPostData] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    setPostData(null);
    setComments([]);
    setError(null);
    setShowComments(false);

    try {
      const data = await api.getExternalPost(postId);
      setPostData(data as Post);
    } catch (error) {
      console.error("Error:", error);
      Sentry.captureException(error);
      setError(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!postData) return;

    setLoadingComments(true);
    setComments([]);

    try {
      const data = await api.getExternalComments(postData.id);
      setComments(data as Comment[]);
      setShowComments(true);
    } catch (error) {
      console.error("Error:", error);
      Sentry.captureException(error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch comments"
      );
    } finally {
      setLoadingComments(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <Globe className="mr-2 text-blue-600" />
        <h2 className="text-2xl font-bold">Third Party API Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-4">
          <label
            htmlFor="postId"
            className="block text-sm font-medium text-gray-700"
          >
            Post ID
          </label>
          <input
            type="number"
            id="postId"
            value={postId}
            onChange={(e) => setPostId(parseInt(e.target.value) || 1)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <button
          onClick={fetchPost}
          disabled={loading}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Fetch Post"}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {postData && (
          <div className="mt-4">
            <div className="p-4 bg-gray-50 rounded">
              <h3 className="font-medium">{postData.title}</h3>
              <p className="mt-2 text-gray-600">{postData.body}</p>
            </div>

            <button
              onClick={fetchComments}
              disabled={loadingComments}
              className="mt-4 w-full bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 flex items-center justify-center"
            >
              <MessageCircle className="mr-2" />
              {loadingComments ? "Loading..." : "Show Comments"}
            </button>

            {showComments && comments.length > 0 && (
              <div className="mt-4 space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded">
                    <p className="font-medium">{comment.name}</p>
                    <p className="text-sm text-gray-600">{comment.email}</p>
                    <p className="mt-2 text-gray-700">{comment.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ThirdPartyApiPage;
