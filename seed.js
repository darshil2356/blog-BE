// seed.js
require('dotenv').config();
const connectDB = require('./config/db');
const Post = require('./models/Post');
const Comment = require('./models/Comment');

const samplePosts = [
  {
    title: 'The Ultimate Guide to Full-Body Workouts',
    slug: 'ultimate-full-body-workout',
    body: '## Intro\nThis is a sample post body. Replace with real markdown or HTML.',
    author: 'Alex Morgan',
    heroImage: ''
  },
  {
    title: 'Build a Balanced Routine',
    slug: 'build-a-balanced-routine',
    body: '## Balanced Routine\nSome sample content.',
    author: 'Coach Sam',
    heroImage: ''
  }
];

async function seed() {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('Clearing data...');
    await Comment.deleteMany({});
    await Post.deleteMany({});

    console.log('Inserting posts...');
    const created = await Post.insertMany(samplePosts);

    console.log('Inserting comments...');
    const comments = [
      { postId: created[0]._id, author: 'Guest', text: 'Awesome article!', rating: 5 },
      { postId: created[0]._id, author: 'Reader', text: 'Helpful tips. Thanks.', rating: 4 },
      { postId: created[1]._id, author: 'User', text: 'Good read', rating: 4 }
    ];
    await Comment.insertMany(comments);

    // recompute rating for each post simply
    for (const p of created) {
      const agg = await Comment.aggregate([
        { $match: { postId: p._id } },
        { $group: { _id: '$postId', avg: { $avg: '$rating' }, count: { $sum: 1 } } }
      ]);
      if (agg[0]) {
        await Post.findByIdAndUpdate(p._id, { rating: { avg: agg[0].avg, count: agg[0].count } });
      }
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed error', err);
    process.exit(1);
  }
}

seed();
