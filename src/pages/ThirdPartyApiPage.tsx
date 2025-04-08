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
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [commentsResponseTime, setCommentsResponseTime] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);

  const fetchPost = async () => {
    setLoading(true);
    setPostData(null);
    setComments([]);
    setResponseTime(null);
    setCommentsResponseTime(null);
    setError(null);
    setShowComments(false);

    try {
      const startTime = performance.now();
      const data = await api.getExternalPost(postId);
      const endTime = performance.now();
      const elapsed = endTime - startTime;
      
      setPostData(data as Post);
      setResponseTime(Math.round(elapsed));
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
  };

  const fetchComments = async () => {
    if (!postData) return;
    
    setLoadingComments(true);
    setCommentsResponseTime(null);

    try {
      const startTime = performance.now();
      const data = await api.getExternalComments(postData.id);
      const endTime = performance.now();
      const elapsed = endTime - startTime;
      
      setComments(data as Comment[]);
      setCommentsResponseTime(Math.round(elapsed));
      setShowComments(true);
    } catch (error) {
      console.error("Error:", error);
      Sentry.captureException(error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to fetch comments"
      );
    } finally {
      setLoadingComments(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto overflow-hidden">
      <div className="flex items-center mb-6">
        <Globe className="flex-shrink-0 mr-2 text-indigo-600" />
        <h2 className="text-2xl font-bold truncate">Third-Party API Demo</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6 overflow-hidden">
        <div className="mb-4">
          <label htmlFor="postId" className="block text-sm font-medium text-gray-700">
            Post ID (1-100)
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <input
              type="number"
              name="postId"
              id="postId"
              min="1"
              max="100"
              className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded-md sm:text-sm border-gray-300 p-2 border"
              value={postId}
              onChange={(e) => setPostId(parseInt(e.target.value) || 1)}
            />
            <button
              onClick={fetchPost}
              disabled={loading}
              className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {loading ? "Loading..." : "Fetch Post"}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Data from JSONPlaceholder, a free fake API for testing
          </p>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-700 rounded border border-red-200">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {postData && (
          <div className="mt-4 space-y-4">
            {/* Formatted display */}
            <div className="p-4 bg-indigo-50 text-indigo-700 rounded">
              <div className="flex justify-between">
                <h3 className="font-semibold mb-1">Post #{postData.id}</h3>
                {responseTime && (
                  <span className="text-xs bg-indigo-200 text-indigo-800 py-1 px-2 rounded-full">
                    {responseTime}ms
                  </span>
                )}
              </div>
              
              <div className="mt-2 max-w-full">
                <h4 className="font-medium text-lg mb-2 break-words">{postData.title}</h4>
                <p className="text-indigo-900 break-words">{postData.body}</p>
              </div>
              
              <div className="mt-3 pt-3 border-t border-indigo-100 flex justify-between items-center">
                <div className="text-xs text-indigo-600">
                  User ID: {postData.userId}
                </div>
                
                <button
                  onClick={fetchComments}
                  disabled={loadingComments}
                  className="inline-flex items-center text-xs px-2 py-1 bg-white border border-indigo-300 rounded-md shadow-sm hover:bg-indigo-50"
                >
                  <MessageCircle className="h-3 w-3 mr-1" />
                  {loadingComments ? "Loading..." : showComments ? "Refresh Comments" : "Show Comments"}
                </button>
              </div>
            </div>
            
            {/* Comments section */}
            {showComments && (
              <div className="p-4 bg-gray-50 rounded border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-gray-700">
                    Comments ({comments.length})
                  </h3>
                  {commentsResponseTime && (
                    <span className="text-xs bg-gray-200 text-gray-700 py-1 px-2 rounded-full">
                      {commentsResponseTime}ms
                    </span>
                  )}
                </div>
                
                <div className="space-y-3 max-w-full">
                  {comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-white rounded shadow-sm">
                      <div className="font-medium truncate">{comment.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{comment.email}</div>
                      <p className="text-sm text-gray-700 break-words">{comment.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Raw JSON */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">Raw JSON:</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto break-words border border-gray-200 max-w-full">
                {JSON.stringify(
                  {
                    post: {
                      ...postData,
                      _metadata: {
                        responseTime: responseTime ? `${responseTime}ms` : 'Not measured',
                        timestamp: new Date().toISOString()
                      }
                    },
                    ...(showComments && {
                      comments: {
                        count: comments.length,
                        data: comments,
                        _metadata: {
                          responseTime: commentsResponseTime ? `${commentsResponseTime}ms` : 'Not measured',
                          timestamp: new Date().toISOString()
                        }
                      }
                    })
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThirdPartyApiPage;