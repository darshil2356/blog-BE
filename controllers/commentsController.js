// controllers/commentsController.js
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const xss = require('xss');

/**
 * GET /api/comments/:postId
 * postId may be objectId or slug; we accept ObjectId or slug
 */
exports.getCommentsByPost = async (req, res, next) => {
  try {
    const rawId = req.params.postId;
    let post;

    // try treat as objectId
    if (/^[0-9a-fA-F]{24}$/.test(rawId)) {
      post = await Post.findById(rawId).lean();
    }
    if (!post) {
      // treat as slug
      post = await Post.findOne({ slug: rawId }).lean();
    }
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const comments = await Comment.find({ postId: post._id }).sort({ createdAt: -1 }).lean();
    res.json(comments);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/comments
 * body: { postId (id or slug), author, text, rating }
 */
exports.createComment = async (req, res, next) => {
  try {
    const { postId, author, text, rating } = req.body;
    if (!postId || !author || !text || !rating) {
      return res.status(400).json({ message: 'postId, author, text and rating are required' });
    }

    // find post
    let post;
    if (/^[0-9a-fA-F]{24}$/.test(postId)) {
      post = await Post.findById(postId);
    }
    if (!post) {
      post = await Post.findOne({ slug: String(postId) });
    }
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const sanitizedAuthor = xss(String(author).trim()).slice(0, 100);
    const sanitizedText = xss(String(text).trim());

    const ratingNum = Number(rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: 'rating must be an integer 1..5' });
    }

    const comment = new Comment({
      postId: post._id,
      author: sanitizedAuthor,
      text: sanitizedText,
      rating: ratingNum
    });

    await comment.save();

    // update post's aggregate rating (simple incremental update)
    // Note: not perfect for race conditions; for high volume use transactions or recompute periodically
    const newCount = (post.rating && post.rating.count) ? post.rating.count + 1 : 1;
    const newAvg = ((post.rating && post.rating.avg ? post.rating.avg : 0) * (newCount - 1) + ratingNum) / newCount;
    post.rating = { avg: newAvg, count: newCount };
    await post.save();

    res.status(201).json(comment);
  } catch (err) {
    next(err);
  }
};
