const mongoose = require('mongoose');
const slugify = require('slugify');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  slug: {
    type: String,
    unique: true
  },
  body: {
    type: String,
    required: [true, 'Post body is required']
  },
  coverImage: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' } // cloudinary public_id for deletion
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [String], // array of strings e.g. ['javascript', 'react']
  likes: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  views: {
    type: Number,
    default: 0
  },
  published: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// ── Auto-generate slug from title before saving ─────────────────
postSchema.pre('save', function (next) {
  if (!this.isModified('title')) return next();
  this.slug = slugify(this.title, {
    lower: true,      // lowercase
    strict: true,     // remove special characters
    trim: true
  }) + '-' + Date.now(); // append timestamp to ensure uniqueness
  next();
});

// ── Virtual field — comment count ───────────────────────────────
// Virtuals are computed fields that are NOT stored in DB
// but available on the document like a real field
postSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'post',
  count: true  // just return the count, not the actual comments
});

// Make virtuals show up in JSON responses
postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Post', postSchema);