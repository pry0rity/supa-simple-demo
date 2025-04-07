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

- **Distributed Tracing**: Connects frontend and backend transactions
- **Performance Monitoring**: Tracks API calls and database operations
- **Error Tracking**: Captures and reports errors across the stack
- **Profiling**: Measures performance metrics

### Demo Pages

- **Slow API**: Tests tracing on deliberately slow endpoints
- **Error Demo**: Demonstrates error tracking and reporting
- **DB Query**: Shows database tracing and performance
- **Batch Requests**: Demonstrates trace propagation across multiple requests
- **Server/Client Components**: Shows different rendering strategies

## Project Structure

### Frontend (/src)
- React application with Sentry integration
- Uses `@sentry/react` for browser monitoring
- Implements trace propagation in API requests

### Backend (/backend)
- Express server with Sentry integration
- Uses `@sentry/node` for server monitoring
- Implements transaction and span creation for operations
- Demonstrates custom context and instrumentation

## Sentry Features Demonstrated

1. **Transaction Creation**: Both automatic and manual transactions
2. **Span Creation**: Child spans for detailed performance tracking
3. **Error Reporting**: Integration with error boundaries
4. **Custom Context**: Adding custom data to transactions and spans
5. **Distributed Tracing**: Connecting frontend and backend traces
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