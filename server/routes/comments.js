const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const { protect, authorize } = require('../middleware/authMiddleware');

// ── POST /api/comments — create comment or reply ────────────────
router.post('/', protect, async (req, res, next) => {
  try {
    const { body, postId, parentId } = req.body;

    // 1. Verify the post exists
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // 2. If parentId provided, verify parent comment exists
    if (parentId) {
      const parentComment = await Comment.findById(parentId);
      if (!parentComment) {
        return res.status(404).json({ message: 'Parent comment not found' });
      }
    }

    const comment = await Comment.create({
      body,
      author: req.user._id,
      post: postId,
      parent: parentId || null  // null = top level, ObjectId = reply
    });

    // Populate author info before sending back
    await comment.populate('author', 'name avatar');

    res.status(201).json(comment);

  } catch (err) {
    next(err);
  }
});

// ── GET /api/comments/post/:postId — get all comments for a post 
router.get('/post/:postId', async (req, res, next) => {
  try {
    // Fetch only top level comments first (parent = null)
    const comments = await Comment.find({
      post: req.params.postId,
      parent: null
    })
      .populate('author', 'name avatar')
      .sort({ createdAt: -1 });

    // For each top level comment, fetch its replies
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parent: comment._id })
          .populate('author', 'name avatar')
          .sort({ createdAt: 1 }); // replies oldest first
        return { ...comment.toObject(), replies };
      })
    );

    res.json(commentsWithReplies);

  } catch (err) {
    next(err);
  }
});

// ── DELETE /api/comments/:id — delete comment + its replies ─────
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Only comment author or admin can delete
    if (
      comment.author.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Delete all replies to this comment first
    await Comment.deleteMany({ parent: comment._id });

    // Then delete the comment itself
    await comment.deleteOne();

    res.json({ message: 'Comment and replies deleted' });

  } catch (err) {
    next(err);
  }
});

// ── PUT /api/comments/:id/like — toggle like on comment ─────────
router.put('/:id/like', protect, async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const alreadyLiked = comment.likes.includes(req.user._id);

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        id => id.toString() !== req.user._id.toString()
      );
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();
    res.json({ likes: comment.likes.length, liked: !alreadyLiked });

  } catch (err) {
    next(err);
  }
});

module.exports = router;