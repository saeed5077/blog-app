import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const EditPost = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [existingImage, setExistingImage] = useState('');
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Fetch existing post data to pre-fill the form ─────────────
  useEffect(() => {
    const fetchPost = async () => {
      try {
        // We only have slug-based GET, so fetch all posts and find by id
        // Better approach: fetch by slug from navigate state
        // For now we use the /me endpoint pattern — fetch post by id directly
        const { data } = await API.get(`/posts?limit=100`);
        const post = data.posts.find(p => p._id === id);

        if (!post) {
          setError('Post not found');
          return;
        }

        // Check ownership before loading
        if (user.id !== post.author._id && user.role !== 'admin') {
          navigate('/');
          return;
        }

        // Pre-fill form with existing data
        setTitle(post.title);
        setBody(post.body);
        setTags(post.tags?.join(', ') || '');
        setExistingImage(post.coverImage?.url || '');

      } catch (err) {
        setError('Failed to load post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCoverImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('body', body);
      formData.append('tags', tags);
      if (coverImage) formData.append('coverImage', coverImage);

      await API.put(`/posts/${id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      navigate(-1); // go back to previous page
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) return <div className="loading">Loading post...</div>;
  if (error) return <div className="loading">{error}</div>;

  return (
    <div className="post-form-container">
      <h2>✏️ Edit Post</h2>

      {error && <div className="error-msg">{error}</div>}

      <form onSubmit={handleSubmit}>

        <div className="post-form-group">
          <label>Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div className="post-form-group">
          <label>Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="javascript, react, mern"
          />
        </div>

        <div className="post-form-group">
          <label>Cover Image</label>

          {/* Show existing image */}
          {existingImage && !preview && (
            <div>
              <p style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                Current image:
              </p>
              <img
                src={existingImage}
                alt="Current cover"
                style={{
                  width: '100%',
                  height: '200px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  marginBottom: '0.75rem'
                }}
              />
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
          />

          {/* Show new preview if user selected a new image */}
          {preview && (
            <img
              src={preview}
              alt="New preview"
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

        <div className="post-form-group">
          <label>Content *</label>
          <ReactQuill
            theme="snow"
            value={body}
            onChange={setBody}
            modules={modules}
            style={{ height: '300px', marginBottom: '3rem' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button
            className="btn-primary"
            type="submit"
            disabled={saving}
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={() => navigate(-1)}
            style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
          >
            Cancel
          </button>
        </div>

      </form>
    </div>
  );
};

export default EditPost;