const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] // regex validation
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false  // never returned in queries by default
  },
  role: {
    type: String,
    enum: ['user', 'admin'],   // only these two values allowed
    default: 'user'
  },
  avatar: {
    type: String,
    default: 'https://res.cloudinary.com/dc3byfonq/image/upload/ar_1:1,c_auto,g_auto,w_500/r_max/cld-sample'
  }
}, { timestamps: true });

// ── Hash password before saving ─────────────────────────────────
// This is a Mongoose "pre-save hook" — runs automatically before .save()
userSchema.pre('save', async function (next) {
  // only hash if password was actually changed
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance method — compare entered password with hashed ──────
// Available on every user document: user.matchPassword(enteredPassword)
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);