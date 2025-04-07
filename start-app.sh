#!/bin/bash

# Start the backend
cd backend
node simple-server.js &
BACKEND_PID=$!

# Start the frontend
cd ..
npm run dev &
FRONTEND_PID=$!

# Wait for both processes to finish
wait $BACKEND_PID $FRONTEND_PID 