require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./config/db');
const postsRouter = require('./routes/posts');
const commentsRouter = require('./routes/comments');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

// Security headers
app.use(helmet());

// Body parser
app.use(express.json({ limit: '10kb' }));

// ----------------------------
// Global CORS setup
// ----------------------------
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from localhost:3000 and any other trusted origin
    if (!origin || origin === 'http://localhost:3000') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

// Handle preflight requests for all routes
app.options('*', cors(corsOptions));

// Logger
app.use(morgan(process.env.NODE_ENV !== 'production' ? 'combined' : 'dev'));

// ----------------------------
// Routes
// ----------------------------
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);

// Health check
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// Error handler
app.use(errorHandler);

// ----------------------------
// Start server
// ----------------------------
(async () => {
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
