import React from "react";
import { Activity } from "../components/Icons";

const HomePage = () => {
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
          <Feature
            title="Slow API Calls"
            description="Demonstrates tracing through artificially delayed API responses"
          />
          <Feature
            title="Error Handling"
            description="Shows how errors are captured and traced through the system"
          />
          <Feature
            title="Database Operations"
            description="Simulates and traces database queries with Prisma"
          />
          <Feature
            title="Batch Processing"
            description="Traces multiple concurrent API requests"
          />
          <Feature
            title="Component Loading"
            description="Demonstrates tracing in both server and client components"
          />
        </div>
      </div>
    </div>
  );
};

const Feature = ({
  title,
  description,
}: {
  title: string;
  description: string;
}) => (
  <div className="border-l-4 border-blue-500 pl-4">
    <h3 className="font-semibold text-lg">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export default HomePage;
