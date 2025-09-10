// models/Comment.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
  postId: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: String, required: true, trim: true, maxlength: 100 },
  text: { type: String, required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  createdAt: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Comment', CommentSchema);
