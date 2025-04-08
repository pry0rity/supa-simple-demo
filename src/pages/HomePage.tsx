import { Activity } from "../components/Icons";
import { useEffect } from "react";
import * as Sentry from "@sentry/react";

const features = [
  {
    title: "Slow API Calls",
    description:
      "Demonstrates tracing through artificially delayed API responses",
  },
  {
    title: "Error Handling",
    description: "Shows how errors are captured and traced through the system",
  },
  {
    title: "Database Operations",
    description: "Simulates and traces database queries with Prisma",
  },
  {
    title: "Batch Processing",
    description: "Traces multiple concurrent API requests",
  },
  {
    title: "Component Loading",
    description: "Demonstrates tracing in both server and client components",
  },
];

const HomePage = () => {
  useEffect(() => {
    // Create a span for page view to demonstrate simple instrumentation
    Sentry.startSpan(
      {
        name: "HomePage.view",
        op: "page.view",
      },
      () => {
        // This is a simple page view span with no async work
        // Just demonstrating minimal instrumentation
      }
    );
  }, []);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-8">
        <Activity className="mr-2 text-blue-600" size={32} />
        <h1 className="text-3xl font-bold">Sentry Tracing Demo</h1>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <p className="text-gray-600 mb-4">
          This demo application showcases Sentry's tracing capabilities across
          various scenarios:
        </p>

        <div className="grid gap-4">
          {features.map(({ title, description }) => (
            <div key={title} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-gray-600">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
