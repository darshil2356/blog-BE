// routes/posts.js
const express = require('express');
const router = express.Router();
const postsController = require('../controllers/postsController');
const { body, validationResult } = require('express-validator');

router.get('/', postsController.getPosts);
router.get('/:slug', postsController.getPostBySlug);

router.post(
  '/',
  [
    body('title').isString().trim().notEmpty().withMessage('title required'),
    body('slug').isString().trim().notEmpty().withMessage('slug required'),
    body('body').isString().trim().notEmpty().withMessage('body required')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  postsController.createPost
);

// optional recalc endpoint
router.put('/:id/recalc-rating', postsController.recalcRating);

router.get('/related/:postId', postsController.getRelatedArticles);

module.exports = router;
