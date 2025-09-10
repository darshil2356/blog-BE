# MERN Blog Backend

## Features
- REST API for posts and comments
- Comments include rating (1..5)
- Posts store aggregate rating (avg, count)
- Basic validation, sanitization, and error handling
- Seed script to populate sample data

## Setup
1. Copy `.env.example` to `.env` and set `MONGO_URI`.
2. Install:
   npm install
3. Seed sample data (optional):
   npm run seed
4. Start:
   npm run dev      # dev with nodemon
   npm start        # production

## Endpoints
- GET  /api/posts                -> list posts (pagination via ?page=&limit=)
- GET  /api/posts/:slug          -> get post by slug
- POST /api/posts                -> create post { title, slug, body, author?, heroImage? }
- PUT  /api/posts/:id/recalc-rating -> recompute rating from comments (optional)
- GET  /api/comments/:postId     -> get comments for post (postId can be slug or ObjectId)
- POST /api/comments             -> add comment { postId, author, text, rating }

