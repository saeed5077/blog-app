import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const SinglePost = () => {
  const { slug } = useParams(); // extract slug from URL
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState(null); // comment id we're replying to
  const [submitting, setSubmitting] = useState(false);

  // ── Fetch post and comments ───────────────────────────────────
  useEffect(() => {
    const fetchPost = async () => {
      try {
        const { data } = await API.get(`/posts/${slug}`);
        setPost(data.post);
        setComments(data.comments);
      } catch (err) {
        setError('Post not found');
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [slug]);

  // ── Like / Unlike ─────────────────────────────────────────────
  const handleLike = async () => {
    if (!user) return navigate('/login');
    try {
      await API.put(`/posts/${post._id}/like`);
      // Toggle like in local state without refetching
      const alreadyLiked = post.likes.includes(user.id);
      setPost({
        ...post,
        likes: alreadyLiked
          ? post.likes.filter(id => id !== user.id)
          : [...post.likes, user.id]
      });
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  // ── Delete post ───────────────────────────────────────────────
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await API.delete(`/posts/${post._id}`);
      navigate('/');
    } catch (err) {
      setError('Failed to delete post');
    }
  };

  // ── Add comment ───────────────────────────────────────────────
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await API.post('/comments', {
        body: commentText,
        postId: post._id
      });
      // Add new comment to top of list with empty replies array
      setComments([{ ...data, replies: [] }, ...comments]);
      setCommentText('');
    } catch (err) {
      setError('Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Add reply ─────────────────────────────────────────────────
  const handleAddReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    setSubmitting(true);
    try {
      const { data } = await API.post('/comments', {
        body: replyText,
        postId: post._id,
        parentId
      });
      // Add reply inside the correct parent comment
      setComments(comments.map(comment =>
        comment._id === parentId
          ? { ...comment, replies: [...comment.replies, data] }
          : comment
      ));
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      setError('Failed to add reply');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete comment ────────────────────────────────────────────
  const handleDeleteComment = async (commentId, parentId = null) => {
    if (!window.confirm('Delete this comment?')) return;
    try {
      await API.delete(`/comments/${commentId}`);
      if (parentId) {
        // It's a reply — remove from inside parent
        setComments(comments.map(comment =>
          comment._id === parentId
            ? { ...comment, replies: comment.replies.filter(r => r._id !== commentId) }
            : comment
        ));
      } else {
        // It's a top level comment — remove from list
        setComments(comments.filter(c => c._id !== commentId));
      }
    } catch (err) {
      setError('Failed to delete comment');
    }
  };

  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });

  const isOwner = user && post && (user.id === post.author._id || user.role === 'admin');
  const isLiked = user && post && post.likes.includes(user.id);

  if (loading) return <div className="loading">Loading post...</div>;
  if (error) return <div className="loading">{error}</div>;
  if (!post) return null;

  return (
    <div className="single-post-container">

      {/* Cover Image */}
      {post.coverImage?.url && (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="single-post-cover"
        />
      )}

      {/* Title */}
      <h1 className="single-post-title">{post.title}</h1>

      {/* Meta */}
      <div className="single-post-meta">
        <img
          src={post.author?.avatar}
          alt={post.author?.name}
          className="avatar"
          style={{ width: 36, height: 36 }}
          onError={(e) => e.target.style.display = 'none'}
        />
        <span><strong>{post.author?.name}</strong></span>
        <span>· {formatDate(post.createdAt)}</span>
        <span>· 👁️ {post.views} views</span>

        {/* Tags */}
        <div className="post-card-tags">
          {post.tags?.map((tag, i) => (
            <span key={i} className="tag">{tag}</span>
          ))}
        </div>
      </div>

      {/* Actions — like, edit, delete */}
      <div className="post-actions">
        <button
          className={`like-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleLike}
        >
          ❤️ {post.likes?.length || 0} {isLiked ? 'Liked' : 'Like'}
        </button>

        {isOwner && (
          <>
            <Link
              to={`/posts/edit/${post._id}`}
              className="btn-primary"
              style={{ padding: '0.5rem 1rem', borderRadius: 8, fontSize: '0.9rem' }}
            >
              ✏️ Edit
            </Link>
            <button className="btn-danger" onClick={handleDeletePost}>
              🗑️ Delete
            </button>
          </>
        )}
      </div>

      {/* Post Body — rendered as HTML from react-quill */}
      <div
        className="single-post-body"
        dangerouslySetInnerHTML={{ __html: post.body }}
      />

      {/* ── Comments Section ── */}
      <div className="comments-section">
        <h3>💬 Comments ({comments.length})</h3>

        {/* Add comment form — only for logged in users */}
        {user ? (
          <form className="comment-form" onSubmit={handleAddComment}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
            />
            <button
              className="btn-primary"
              type="submit"
              disabled={submitting}
            >
              {submitting ? '...' : 'Post'}
            </button>
          </form>
        ) : (
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            <Link to="/login" style={{ color: '#4f46e5' }}>Sign in</Link> to leave a comment
          </p>
        )}

        {/* Comments list */}
        {comments.length === 0 ? (
          <p className="empty">No comments yet. Be the first!</p>
        ) : (
          comments.map(comment => (
            <div key={comment._id} className="comment">

              {/* Comment header */}
              <div className="comment-header">
                <div className="comment-author">
                  <img
                    src={comment.author?.avatar}
                    alt={comment.author?.name}
                    className="avatar"
                    onError={(e) => e.target.style.display = 'none'}
                  />
                  {comment.author?.name}
                  <span style={{ color: '#9ca3af', fontWeight: 400 }}>
                    · {formatDate(comment.createdAt)}
                  </span>
                </div>
              </div>

              {/* Comment body */}
              <p className="comment-body">{comment.body}</p>

              {/* Comment actions */}
              <div className="comment-actions">
                {user && (
                  <button onClick={() =>
                    setReplyingTo(replyingTo === comment._id ? null : comment._id)
                  }>
                    💬 Reply
                  </button>
                )}
                {user && (user.id === comment.author?._id || user.role === 'admin') && (
                  <button onClick={() => handleDeleteComment(comment._id)}>
                    🗑️ Delete
                  </button>
                )}
              </div>

              {/* Reply form */}
              {replyingTo === comment._id && (
                <form
                  className="comment-form"
                  style={{ marginTop: '0.75rem' }}
                  onSubmit={(e) => handleAddReply(e, comment._id)}
                >
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${comment.author?.name}...`}
                    autoFocus
                  />
                  <button className="btn-primary" type="submit" disabled={submitting}>
                    {submitting ? '...' : 'Reply'}
                  </button>
                </form>
              )}

              {/* Replies */}
              {comment.replies?.length > 0 && (
                <div className="replies">
                  {comment.replies.map(reply => (
                    <div key={reply._id} className="comment">
                      <div className="comment-header">
                        <div className="comment-author">
                          <img
                            src={reply.author?.avatar}
                            alt={reply.author?.name}
                            className="avatar"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          {reply.author?.name}
                          <span style={{ color: '#9ca3af', fontWeight: 400 }}>
                            · {formatDate(reply.createdAt)}
                          </span>
                        </div>
                      </div>
                      <p className="comment-body">{reply.body}</p>
                      <div className="comment-actions">
                        {user && (user.id === reply.author?._id || user.role === 'admin') && (
                          <button onClick={() =>
                            handleDeleteComment(reply._id, comment._id)
                          }>
                            🗑️ Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SinglePost;