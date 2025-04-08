# Sentry Tracing Demo

A full-stack application that demonstrates Sentry's distributed tracing capabilities between frontend and backend services.

## Setup

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn
- A Sentry account with a DSN
- Supabase account and credentials

### Environment Variables

Create a `.env` file in the root directory:

```
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Create a `.env` file in the `backend` directory:

```
SENTRY_DSN=your_sentry_dsn_here
PORT=3000
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Installation

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
npm install --prefix backend
```

## Running the Application

### Start the backend server

```bash
npm run backend
# or
./start-backend.sh
```

### Start the frontend

```bash
npm run dev
# or
./start-frontend.sh
```

### Start both simultaneously

```bash
./start-app.sh
```

## Features

### Sentry Integration

This demo implements Sentry with:

- **Distributed Tracing**: Connects frontend and backend traces with proper context propagation
- **Performance Monitoring**: Tracks API calls and database operations through spans
- **Error Tracking**: Captures and reports errors across the stack
- **Profiling**: Measures performance metrics

### Demo Pages

- **Slow API**: Tests tracing on deliberately slow endpoints
- **Error Demo**: Demonstrates error tracking and reporting
- **DB Query**: Shows database spans and performance monitoring
- **Batch Requests**: Demonstrates trace propagation across multiple requests
- **Server/Client Components**: Shows different rendering strategies

## Project Structure

### Frontend (/src)
- React application with Sentry integration
- Uses `@sentry/react` for browser monitoring
- Implements trace context propagation in API requests

### Backend (/backend)
- Express server with Sentry integration
- Uses `@sentry/node` for server monitoring
- Implements spans for operation monitoring
- Demonstrates auto-instrumentation and custom spans

## Sentry Features Demonstrated

1. **Auto-Instrumentation**: Automatic tracing for React and Express
2. **Custom Spans**: Creating spans for detailed performance tracking
3. **Error Reporting**: Integration with error boundaries
4. **Custom Context**: Adding custom attributes to spans
5. **Distributed Tracing**: Connecting frontend and backend traces through context propagation
6. **Profiling**: Performance profiling integrated with traces

## Technologies Used

- Frontend:
  - React
  - Vite
  - TypeScript
  - Tailwind CSS
  - Sentry React SDK

- Backend:
  - Node.js
  - Express
  - TypeScript
  - Supabase
  - Sentry Node SDK
  - Sentry Profiling