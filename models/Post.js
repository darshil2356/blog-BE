// models/Post.js
const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PostSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  body: { type: String, required: true },
  date: { type: Date, required: true, default: Date.now },
  author: { type: String, default: 'Anonymous' },
  heroImage: { type: String, default: '' },
  // keep aggregate rating data to avoid expensive computations on read
  rating: {
    avg: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  }
}, { timestamps: true });

// helper: recalc rating from comments might be done by background job, but we'll expose a route if needed

module.exports = mongoose.model('Post', PostSchema);
