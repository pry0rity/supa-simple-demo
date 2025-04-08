import { useState } from "react";
import { AlertOctagon } from "../components/Icons";
import * as Sentry from "@sentry/react";
import { api } from "../services/api";

interface User {
  id: number;
  name: string;
  email: string;
}

interface Post {
  id: number;
  title: string;
  userId: number;
}

interface UserWithPosts {
  user: User;
  posts: Post[];
}

const NPlusOneQueryPage = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UserWithPosts[]>([]);
  const [queryCount, setQueryCount] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isOptimized, setIsOptimized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simulate an N+1 query problem
  const fetchDataWithNPlusOne = async () => {
    setLoading(true);
    setResults([]);
    setQueryCount(0);
    setTotalTime(0);
    setIsOptimized(false);
    setError(null);

    const startTime = performance.now();
    let queryCounter = 0;
    
    await Sentry.startSpan(
      {
        name: "NPlusOneQuery.problem",
        op: "demo.n_plus_one",
      },
      async () => {
        try {
          // First query: Get all users (1 query)
          queryCounter++;
          const users: User[] = await api.getJsonPlaceholderUsers();
          
          const usersWithPosts: UserWithPosts[] = [];
          
          // Then for each user, get their posts (N queries) - this is the N+1 problem
          for (const user of users.slice(0, 5)) { // Limit to 5 users for demo purposes
            queryCounter++;
            
            // Each API call is automatically instrumented
            const posts: Post[] = await api.getJsonPlaceholderUserPosts(user.id);
            
            // Add a small artificial delay to simulate database query time
            await new Promise(resolve => setTimeout(resolve, 100));
            
            usersWithPosts.push({
              user,
              posts
            });
          }
          
          const endTime = performance.now();
          
          setResults(usersWithPosts);
          setQueryCount(queryCounter);
          setTotalTime(Math.round(endTime - startTime));
        } catch (error) {
          console.error("Error:", error);
          Sentry.captureException(error);
          setError(
            error instanceof Error ? error.message : "An unexpected error occurred"
          );
        } finally {
          setLoading(false);
        }
      });
  };

  // Simulate the proper way to solve the N+1 query problem
  const fetchDataWithJoin = async () => {
    setLoading(true);
    setResults([]);
    setQueryCount(0);
    setTotalTime(0);
    setIsOptimized(true);
    setError(null);

    const startTime = performance.now();
    let queryCounter = 0;
    
    await Sentry.startSpan(
      {
        name: "NPlusOneQuery.optimized",
        op: "demo.optimized_query",
      },
      async () => {
        try {
          // One query: Get all users
          queryCounter++;
          const users: User[] = await api.getJsonPlaceholderUsers();
          
          // One more query: Get all posts for these users in a single batch
          queryCounter++;
          // Get the user IDs we want to fetch
          const userIds = users.slice(0, 5).map(user => user.id);
          // Use our optimized API method to fetch all posts in one request
          const allPosts: Post[] = await api.getJsonPlaceholderPostsForUsers(userIds);
          
          // Artificially delay to simulate the join operation
          await new Promise(resolve => setTimeout(resolve, 150));
          
          // In memory, associate posts with their users
          const usersWithPosts: UserWithPosts[] = [];
          for (const user of users.slice(0, 5)) {
            const userPosts = allPosts.filter(post => post.userId === user.id);
            usersWithPosts.push({
              user,
              posts: userPosts
            });
          }
          
          const endTime = performance.now();
          
          setResults(usersWithPosts);
          setQueryCount(queryCounter);
          setTotalTime(Math.round(endTime - startTime));
        } catch (error) {
          console.error("Error:", error);
          Sentry.captureException(error);
          setError(
            error instanceof Error ? error.message : "An unexpected error occurred"
          );
        } finally {
          setLoading(false);
        }
      });
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
            The N+1 query problem occurs when fetching a list of items and their related data. Instead of using joins or batch queries, code makes 1 query to get the main entities plus N additional queries (one for each entity) to get related data.
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
            <div className={`p-4 rounded ${isOptimized ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">
                  {isOptimized ? 'Optimized Query Results' : 'N+1 Query Results'}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`text-xs py-1 px-2 rounded-full ${
                    isOptimized 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-amber-200 text-amber-800'
                  }`}>
                    {queryCount} queries
                  </span>
                  <span className={`text-xs py-1 px-2 rounded-full ${
                    isOptimized 
                      ? 'bg-green-200 text-green-800' 
                      : 'bg-amber-200 text-amber-800'
                  }`}>
                    {totalTime}ms
                  </span>
                </div>
              </div>
              
              <div className="flex items-center mb-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${isOptimized ? 'bg-green-500' : 'bg-amber-500'}`}
                    style={{ width: `100%` }}
                  ></div>
                </div>
                <div className="ml-2 text-sm font-medium">
                  {(totalTime / 1000).toFixed(2)}s
                </div>
              </div>

              {isOptimized && (
                <div className="mb-4 p-3 bg-green-100 text-green-800 rounded-md">
                  <div className="font-medium mb-1">✓ Optimized Solution</div>
                  <div className="text-sm">
                    Using a batch query for posts instead of individual queries for each user's posts
                    reduces the total number of database calls from N+1 to just 2.
                  </div>
                </div>
              )}
              
              <div className="space-y-4 mt-4">
                {results.map(({ user, posts }) => (
                  <div key={user.id} className={`border rounded-lg overflow-hidden ${
                    isOptimized ? 'border-green-200' : 'border-amber-200'
                  }`}>
                    <div className={`p-3 ${isOptimized ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <div className="font-medium">{user.name}</div>
                      <div className={`text-xs ${isOptimized ? 'text-green-700' : 'text-amber-700'}`}>
                        {user.email}
                      </div>
                    </div>
                    
                    <div className="p-3 bg-white">
                      <div className="text-sm font-medium mb-2">Posts ({posts.length})</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {posts.map(post => (
                          <div key={post.id} className="text-sm p-2 bg-gray-50 rounded">
                            {post.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className={`text-xs mt-3 pt-2 ${
                isOptimized 
                  ? 'text-green-600 border-t border-green-100' 
                  : 'text-amber-600 border-t border-amber-100'
              }`}>
                {queryCount === 1 ? (
                  <span>Used 1 query</span>
                ) : queryCount === 2 ? (
                  <span>Used 2 queries (1 for users, 1 for all posts)</span>
                ) : (
                  <span>Used {queryCount} queries (1 for users, {queryCount-1} for posts)</span>
                )}
              </div>
            </div>
            
            {/* Raw JSON */}
            <div>
              <h3 className="font-semibold mb-2 text-sm text-gray-600">Raw JSON:</h3>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-x-auto break-words border border-gray-200 max-w-full">
                {JSON.stringify(
                  {
                    performance: {
                      isOptimized,
                      queryCount,
                      totalTime: `${totalTime}ms`,
                      averageTimePerQuery: `${Math.round(totalTime/queryCount)}ms`,
                      optimizationMethod: isOptimized ? 'Batch query' : 'N+1 queries',
                    },
                    results: results.map(item => ({
                      user: {
                        id: item.user.id,
                        name: item.user.name,
                        email: item.user.email,
                      },
                      posts: item.posts.map(post => ({
                        id: post.id,
                        title: post.title,
                      })),
                      postsCount: item.posts.length,
                    })),
                    _metadata: {
                      timestamp: new Date().toISOString(),
                      resultCount: results.length,
                      solutionType: isOptimized ? 'optimized' : 'n+1-problem'
                    }
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

export default NPlusOneQueryPage;