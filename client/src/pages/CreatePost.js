import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import API from '../api';

const CreatePost = () => {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');       // react-quill value
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [preview, setPreview] = useState(''); // local image preview URL
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // When user selects an image, show preview immediately
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setPreview(URL.createObjectURL(file)); // creates a local blob URL for preview
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Must use FormData — not JSON — because we're sending a file
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      formData.append('tags', tags);
      if (coverImage) formData.append('coverImage', coverImage);

      const { data } = await API.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(`/posts/${data.slug}`); // go to the new post
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  // react-quill toolbar config
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link', 'image'],
      ['blockquote', 'code-block'],
      ['clean']
    ]
  };

  return (
    <div className="post-form-container">
      <h2>✍️ Create New Post</h2>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>

        {/* Title */}
        <div className="post-form-group">
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter post title..."
            required
          />
        </div>

        {/* Tags */}
        <div className="post-form-group">
          <label>Tags <span style={{ color: '#9ca3af' }}>(comma separated)</span></label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="javascript, react, mern"
          />
        </div>

        {/* Cover Image */}
        <div className="post-form-group">
          <label>Cover Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />
          {/* Image preview */}
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{
                marginTop: '0.75rem',
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '8px'
              }}
            />
          )}
        </div>

        {/* Body — React Quill rich text editor */}
        <div className="post-form-group">
          <label>Content *</label>
          <ReactQuill
            theme="snow"
            value={body}
            onChange={setBody}  // quill calls onChange with HTML string directly
            modules={modules}
            placeholder="Write your post content here..."
            style={{ height: '300px', marginBottom: '3rem' }}
          />
        </div>

        <button
          className="btn-primary"
          type="submit"
          disabled={loading}
          style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
        >
          {loading ? 'Publishing...' : 'Publish Post'}
        </button>

      </form>
    </div>
  );
};

export default CreatePost;