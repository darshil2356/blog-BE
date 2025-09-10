// routes/comments.js
const express = require('express');
const router = express.Router();
const commentsController = require('../controllers/commentsController');
const { body, validationResult } = require('express-validator');

router.get('/:postId', commentsController.getCommentsByPost);

router.post(
  '/',
  [
    body('postId').exists().withMessage('postId required'),
    body('author').isString().trim().notEmpty().withMessage('author required'),
    body('text').isString().trim().notEmpty().withMessage('text required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating 1..5 required')
  ],
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  },
  commentsController.createComment
);

module.exports = router;
