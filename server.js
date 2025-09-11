// server.js
require("dotenv").config();
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./config/db");
const postsRouter = require("./routes/posts");
const commentsRouter = require("./routes/comments");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 4000;

// security
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

// ✅ allow all origins for now (to fix CORS issue)
app.use(cors({ origin: "*", credentials: true }));

// logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// routes
app.use("/api/posts", postsRouter);
app.use("/api/comments", commentsRouter);

// healthcheck
app.get("/api/health", (req, res) => res.json({ ok: true, ts: Date.now() }));

// root
app.get("/", (req, res) => res.send("API Running"));

// error handler
app.use(errorHandler);

// start server locally
if (require.main === module) {
  (async () => {
    await connectDB(process.env.MONGO_URI);
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })();
} else {
  // For Vercel, connect DB lazily
  connectDB(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection failed", err));
}

module.exports = app;
