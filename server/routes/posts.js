const express = require('express');
const router = express.Router();
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const { protect, authorize } = require('../middleware/authMiddleware');
const { upload, cloudinary } = require('../utils/cloudinary');

// ── GET /api/posts — get all published posts (with pagination) ──
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;   // current page, default 1
    const limit = parseInt(req.query.limit) || 10; // posts per page, default 10
    const skip = (page - 1) * limit;               // how many to skip

    // Build filter object dynamically
    const filter = { published: true };

    // If search query exists, search in title and body
    if (req.query.search) {
      filter.$or = [
        { title: { $regex: req.query.search, $options: 'i' } }, // i = case insensitive
        { body:  { $regex: req.query.search, $options: 'i' } }
      ];
    }

    // Filter by tag if provided: /api/posts?tag=javascript
    if (req.query.tag) {
      filter.tags = req.query.tag;
    }

    // Run both queries in parallel with Promise.all for efficiency
    const [posts, total] = await Promise.all([
      Post.find(filter)
        .populate('author', 'name avatar')  // replace ObjectId with actual user data
        .populate('commentCount')           // virtual field
        .sort({ createdAt: -1 })            // newest first
        .skip(skip)
        .limit(limit),
      Post.countDocuments(filter)           // total count for pagination UI
    ]);

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (err) {
    next(err);
  }
});

// ── GET /api/posts/:slug — get single post by slug ──────────────
router.get('/:slug', async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug })
      .populate('author', 'name avatar email');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Increment view count every time post is fetched
    post.views += 1;
    await post.save();

    // Fetch comments separately with nested structure
    const comments = await Comment.find({ post: post._id, parent: null })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    // For each top-level comment, fetch its replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parent: comment._id })
          .populate('author', 'name avatar')
          .sort({ createdAt: 1 }); // replies oldest first
        return { ...comment.toObject(), replies };
      })
    );

    res.json({ post, comments: commentsWithReplies });

  } catch (err) {
    next(err);
  }
});

// ── POST /api/posts — create a post ────────────────────────────
// upload.single('coverImage') is multer middleware
// it processes the file and uploads to cloudinary BEFORE our handler runs
router.post('/', protect, upload.single('coverImage'), async (req, res, next) => {
  try {
    const { title, body, tags, published } = req.body;

    const postData = {
      title,
      body,
      author: req.user._id,
      tags: tags ? tags.split(',').map(t => t.trim()) : [], // "js, react" → ['js','react']
      published: published !== undefined ? published : true
    };

    // If image was uploaded, multer+cloudinary puts it in req.file
    if (req.file) {
      postData.coverImage = {
        url: req.file.path,        // cloudinary URL
        publicId: req.file.filename // cloudinary public_id for deletion
      };
    }

    const post = await Post.create(postData);
    await post.populate('author', 'name avatar');

    res.status(201).json(post);

  } catch (err) {
    next(err);
  }
});

// ── PUT /api/posts/:id — update a post ─────────────────────────
router.put('/:id', protect, upload.single('coverImage'), async (req, res, next) => {
  try {
    let post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only author or admin can update
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this post' });
    }

    const { title, body, tags, published } = req.body;

    if (title) post.title = title;
    if (body) post.body = body;
    if (published !== undefined) post.published = published;
    if (tags) post.tags = tags.split(',').map(t => t.trim());

    // If new image uploaded, delete old one from cloudinary first
    if (req.file) {
      if (post.coverImage.publicId) {
        await cloudinary.uploader.destroy(post.coverImage.publicId);
      }
      post.coverImage = {
        url: req.file.path,
        publicId: req.file.filename
      };
    }

    const updated = await post.save();
    res.json(updated);

  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/posts/:id ───────────────────────────────────────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Only author or admin can delete
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this post' });
    }

    // Delete image from cloudinary if exists
    if (post.coverImage.publicId) {
      await cloudinary.uploader.destroy(post.coverImage.publicId);
    }

    // Delete all comments belonging to this post
    await Comment.deleteMany({ post: post._id });

    await post.deleteOne();
    res.json({ message: 'Post and associated comments deleted' });

  } catch (err) {
    next(err);
  }
});

// ── PUT /api/posts/:id/like — toggle like ───────────────────────
router.put('/:id/like', protect, async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      // Unlike — remove user id from likes array
      post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    } else {
      // Like — add user id to likes array
      post.likes.push(req.user._id);
    }

    await post.save();
    res.json({ likes: post.likes.length, liked: !alreadyLiked });

  } catch (err) {
    next(err);
  }
});

module.exports = router;