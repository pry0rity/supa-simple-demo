# Claude Configuration

## Project Structure

### Frontend (/src)
- `App.tsx`: Main application component
- `api/`: API client interfaces
- `lib/`: Utility libraries including Supabase client
- `pages/`: Application page components
  - `BatchRequestsPage.tsx`: Page for batch request demos
  - `ClientComponentPage.tsx`: Client-side rendering example
  - `DbQueryPage.tsx`: Database query demo page
  - `ErrorPage.tsx`: Error handling page
  - `HomePage.tsx`: Application home page
  - `ServerComponentPage.tsx`: Server-side rendering example
  - `SlowApiPage.tsx`: Demo for slow API endpoints
- `server.ts`: Server-side code
- `services/`: Service layer implementation
  - `api.ts`: API service functions

### Backend (/backend)
- `server.js`: Main server entry point
- `simple-server.js/mjs`: Simplified server implementations
- `src/`: Server source code
  - `controllers/`: Request controllers
    - `dbQueryController.ts`: Database query handlers
    - `slowApiController.ts`: Slow API endpoint handlers
  - `routes/`: API route definitions
    - `dbQueryRoutes.ts`: Database query routes
    - `slowApiRoutes.ts`: Slow API routes
  - `index.ts`: Main backend entry point

## Type Checking Commands

To check for TypeScript errors in server-side code:
```bash
npx tsc --noEmit --project tsconfig.node.json
```

To check for TypeScript errors in client-side code:
```bash
npx tsc --noEmit --project tsconfig.app.json
```