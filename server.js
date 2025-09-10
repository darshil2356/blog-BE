// server.js
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

app.use(helmet());
app.use(express.json({ limit: '10kb' })); 
const corsOptions = {
  origin: 'https://blog-59upu9doj-darshil2356s-projects.vercel.app', // allow your frontend
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// routes
app.use('/api/posts', postsRouter);
app.use('/api/comments', commentsRouter);

// healthcheck
app.get('/health', (req, res) => res.json({ ok: true, ts: Date.now() }));

// error handler
app.use(errorHandler);

// start server
(async () => {
    // console.log(process.env.MONGO_URI)
  await connectDB(process.env.MONGO_URI);
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
