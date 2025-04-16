import { useState } from "react";
import { AlertTriangle, Server, Cpu } from "../components/Icons";
import * as Sentry from "@sentry/react";

const ErrorPage = () => {
  const [error, setError] = useState<{ message: string; source: 'client' | 'server' } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const handleClientError = () => {
    Sentry.startSpan(
      {
        name: "ErrorPage.triggerClientError",
        op: "error.demo.client",
      },
      () => {
        try {
          // Throwing error with file location information
          const clientError = new Error("THIS IS A CLIENT ERROR: React component deliberately failed for demonstration purposes");
          // Add stack trace information (or mock it for demonstration)
          clientError.stack = `Error: THIS IS A CLIENT ERROR: React component deliberately failed for demonstration purposes
    at handleClientError (/Users/willmcmullen/Projects/supa-simple-demo/src/pages/ErrorPage.tsx:17:17)
    at onClick (react-dom.development.js:...)`;
          throw clientError;
        } catch (err) {
          const errorWithLocation = err instanceof Error 
            ? `${err.message}\n\nLocation: /Users/willmcmullen/Projects/supa-simple-demo/src/pages/ErrorPage.tsx:handleClientError (line ~17)`
            : "An unexpected error occurred";
            
          setError({
            message: errorWithLocation,
            source: 'client'
          });
          console.error("Caught client error:", err);
          
          // Report to Sentry
          Sentry.captureException(err);
        }
      }
    );
  };

  const handleServerError = async () => {
    setLoading(true);
    
    // Use a Sentry transaction to properly track this entire operation
    const transaction = Sentry.startTransaction({
      name: 'trigger-server-error',
      op: 'ui.action'
    });
    
    try {
      // Create a child span for the fetch operation with proper timing
      const fetchSpan = transaction.startChild({
        op: 'http.client',
        description: 'Fetch to debug-sentry endpoint'
      });
      
      // Get Sentry trace headers for this transaction to link frontend and backend
      const sentryTrace = fetchSpan.toTraceparent();
      
      // Add these headers to the fetch request for proper trace context propagation
      const response = await fetch('http://localhost:3000/api/debug-sentry', {
        headers: {
          'sentry-trace': sentryTrace
        }
      });
      
      // Finish the fetch span with status info
      fetchSpan.setData('status', response.status);
      fetchSpan.setStatus(response.ok ? 'ok' : 'error');
      fetchSpan.finish();
      
      // If the server returns a 500 error, it will still have a response body with error details
      if (!response.ok) {
        // Start a child span for processing the error response
        const processSpan = transaction.startChild({
          op: 'process.error',
          description: 'Process server error response'
        });
        
        const errorData = await response.json();
        
        // Create a detailed error message from the server response
        const serverErrorMsg = errorData.error?.message 
          ? `${errorData.error.name || 'ServerError'}: ${errorData.error.message}`
          : 'An unexpected server error occurred';
        
        // Include additional details if available
        const details = errorData.error?.details 
          ? `\nLocation: ${errorData.error.details.location || 'unknown'}\nEndpoint: ${errorData.error.details.endpoint || 'unknown'}\nTimestamp: ${errorData.error.details.timestamp || 'unknown'}`
          : '';
        
        setError({
          message: `${serverErrorMsg}${details}`,
          source: 'server'
        });
        
        console.error("Server returned error:", errorData);
        
        // Add server error details to the span
        processSpan.setData('error_data', errorData);
        processSpan.finish();
        
        // Report to Sentry with context
        Sentry.configureScope(scope => {
          scope.setContext("server_error", errorData);
          if (errorData.sentry?.eventId) {
            scope.setTag("server_event_id", errorData.sentry.eventId);
            // Link to the server-side event
            scope.setTag("linked_event", errorData.sentry.eventId);
          }
        });
        
        Sentry.captureMessage(`Frontend captured server error: ${serverErrorMsg}`, Sentry.Severity.Error);
      }
    } catch (err) {
      // This handles network errors or other client-side issues reaching the server
      setError({
        message: err instanceof Error 
          ? `Network error connecting to server: ${err.message}` 
          : "An unexpected server error occurred",
        source: 'server'
      });
      console.error("Caught network error reaching server:", err);
      
      // Report to Sentry
      Sentry.captureException(err);
      
      // Set transaction status to error
      transaction.setStatus('error');
    } finally {
      // Complete the transaction
      transaction.finish();
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center mb-6">
        <AlertTriangle className="mr-2 text-red-600" />
        <h2 className="text-2xl font-bold">Trigger Upstream Error</h2>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="mb-4 text-gray-700">
          This page demonstrates how errors are captured and reported to Sentry from different sources. 
          Select one of the buttons below to trigger a demonstration error.
        </p>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
            <div className="flex items-center mb-3">
              <Cpu className="mr-2 h-5 w-5 text-orange-600" />
              <h3 className="font-medium">Client-Side Error</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Triggers an error in your browser's JavaScript code. The error is caught, displayed below,
              and reported to Sentry.
            </p>
            <button
              onClick={handleClientError}
              className="w-full bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 flex items-center justify-center"
              disabled={loading}
            >
              <Cpu className="mr-2 h-5 w-5" />
              Trigger Client Error
            </button>
          </div>

          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <div className="flex items-center mb-3">
              <Server className="mr-2 h-5 w-5 text-red-600" />
              <h3 className="font-medium">Server-Side Error</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Makes an API request that will fail on the backend server. The error is caught, displayed below,
              and reported to Sentry from both client and server.
            </p>
            <button
              onClick={handleServerError}
              className="w-full bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 flex items-center justify-center"
              disabled={loading}
            >
              <Server className="mr-2 h-5 w-5" />
              Trigger Server Error
              {loading && <span className="ml-2 animate-pulse">...</span>}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-8 border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium mb-4">Error Details</h3>
            
            <div className={`p-5 rounded-lg border-2 ${
              error.source === 'client' 
                ? 'bg-orange-50 border-orange-300' 
                : 'bg-red-50 border-red-300'
            }`}>
              <div className="flex items-center mb-3">
                {error.source === 'client' 
                  ? <Cpu className="mr-2 h-6 w-6 text-orange-600" /> 
                  : <Server className="mr-2 h-6 w-6 text-red-600" />
                }
                <h4 className="text-lg font-bold">
                  {error.source === 'client' 
                    ? 'CLIENT ERROR CAPTURED' 
                    : 'SERVER ERROR CAPTURED'}
                </h4>
              </div>
              
              <div className="ml-8">
                {/* Display error message with proper formatting for newlines */}
                {error.message.split('\n').map((line, i) => {
                  // Format location information differently
                  if (line.startsWith('Location:')) {
                    return (
                      <p key={i} className="text-sm mt-3 p-2 bg-gray-100 rounded border border-gray-300 font-mono">
                        <strong>Location:</strong> {line.substring(9).trim()}
                      </p>
                    );
                  } else if (line.startsWith('Endpoint:') || line.startsWith('Timestamp:')) {
                    return (
                      <p key={i} className="text-xs mt-1 text-gray-600">
                        {line}
                      </p>
                    );
                  } else {
                    return (
                      <p key={i} className={`${i > 0 ? "text-sm mt-1" : "font-medium"}`}>
                        {line}
                      </p>
                    );
                  }
                })}
              </div>
              
              <div className="flex items-center mt-4 pt-3 border-t border-gray-300">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                <p className="text-sm text-gray-700">
                  This error has been captured by Sentry and reported to the dashboard.
                  {error.source === 'server' && " Both client and server logs include this error."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorPage;
