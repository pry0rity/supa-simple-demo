import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/api/slow', async (req, res) => {
  // Simulate a slow API response
  await new Promise(resolve => setTimeout(resolve, 2000));
  res.json({ message: "This response took 2 seconds to complete!" });
});

app.get('/api/db', async (req, res) => {
  try {
    // Mock database response
    const users = [
      { id: 1, name: 'John Doe', email: 'john@example.com', created_at: '2023-01-01' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com', created_at: '2023-01-02' },
      { id: 3, name: 'Bob Johnson', email: 'bob@example.com', created_at: '2023-01-03' }
    ];
    res.json(users);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}); 