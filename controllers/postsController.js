// controllers/postsController.js
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const xss = require('xss');

/**
 * GET /api/posts
 * optional query: ?limit=10&page=1
 */
exports.getPosts = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find().sort({ date: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments()
    ]);

    res.json({ data: posts, meta: { total, page, limit } });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/posts/:slug
 */
exports.getPostBySlug = async (req, res, next) => {
  try {
    const slug = req.params.slug;
    const post = await Post.findOne({ slug }).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // include comments summary or top comments if requested
    const comments = await Comment.find({ postId: post._id }).sort({ createdAt: -1 }).limit(50).lean();

    res.json({ data: { ...post, comments } });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/posts
 * body: { title, slug, body, date?, author?, heroImage? }
 */
exports.createPost = async (req, res, next) => {
  try {
    const { title, slug, body, author, heroImage } = req.body;
    if (!title || !slug || !body) {
      return res.status(400).json({ message: 'title, slug and body are required' });
    }

    // simple sanitization
    const post = new Post({
      title: xss(title),
      slug: xss(slug),
      body: xss(body),
      author: author ? xss(author) : 'Anonymous',
      heroImage: heroImage ? xss(heroImage) : ''
    });

    await post.save();
    res.status(201).json({ data: post });
  } catch (err) {
    // mongoose duplicate slug -> code 11000
    if (err.code === 11000) return res.status(409).json({ message: 'slug already exists' });
    next(err);
  }
};

/**
 * Optional: recalc post rating from comments (PUT /api/posts/:id/recalc-rating)
 */
exports.recalcRating = async (req, res, next) => {
  try {
    const postId = req.params.id;
    const agg = await Comment.aggregate([
      { $match: { postId: require('mongoose').Types.ObjectId(postId) } },
      { $group: { _id: '$postId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
    ]);

    if (!agg[0]) {
      await Post.findByIdAndUpdate(postId, { 'rating.avg': 0, 'rating.count': 0 });
      return res.json({ avg: 0, count: 0 });
    }
    const { avg, count } = agg[0];
    await Post.findByIdAndUpdate(postId, { 'rating.avg': avg, 'rating.count': count });
    res.json({ avg, count });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/related/:postId
 * Returns related posts based on tags or title keywords
 */
exports.getRelatedArticles = async (req, res, next) => {
  try {
    const postId = req.params.postId;
    const post = await Post.findById(postId).lean();
    if (!post) return res.status(404).json({ message: 'Post not found' });

    let query = { _id: { $ne: post._id } };
    let related = [];

    if (post.tags && post.tags.length > 0) {
      query.tags = { $in: post.tags };
      related = await Post.find(query).sort({ date: -1 }).limit(5).lean();
    }

    // If not enough by tags, fallback to title keywords
    if (related.length < 5) {
      const remaining = 5 - related.length;
      const keywords = post.title.split(' ').filter((w) => w.length > 3);
      const keywordQuery = {
        _id: { $nin: [post._id, ...related.map((r) => r._id)] }, // exclude already selected
        $or: keywords.map((k) => ({ title: { $regex: k, $options: 'i' } })),
      };
      const keywordPosts = await Post.find(keywordQuery)
        .sort({ date: -1 })
        .limit(remaining)
        .lean();
      related = [...related, ...keywordPosts];
    }

    // If still less than 5, fill with latest posts
    if (related.length < 5) {
      const remaining = 5 - related.length;
      const fallbackPosts = await Post.find({ _id: { $nin: [post._id, ...related.map((r) => r._id)] } })
        .sort({ date: -1 })
        .limit(remaining)
        .lean();
      related = [...related, ...fallbackPosts];
    }

    // Map to frontend format
    const mapped = related.map((r) => ({
      id: r._id,
      title: r.title,
      author: r.author,
      slug: r.slug,
      excerpt: r.body.slice(0, 120),
      image: r.heroImage || '/placeholder.jpg',
    }));

    res.json(mapped);
  } catch (err) {
    next(err);
  }
};

