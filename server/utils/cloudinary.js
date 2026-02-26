const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure cloudinary with our credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure storage — tells multer to send files directly to cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'blog-app',        // folder name in your cloudinary account
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 1200, height: 630, crop: 'fill' }] // auto resize
  }
});

// Export the configured multer upload middleware
const upload = multer({ storage });

module.exports = { upload, cloudinary };