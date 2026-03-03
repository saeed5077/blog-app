import { useNavigate } from 'react-router-dom';

const PostCard = ({ post }) => {
  const navigate = useNavigate();

  // Strip HTML tags from body (react-quill saves HTML)
  // and cut to first 120 characters as excerpt
  const getExcerpt = (html) => {
    const text = html.replace(/<[^>]*>/g, '');
    return text.length > 120 ? text.substring(0, 120) + '...' : text;
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="post-card" onClick={() => navigate(`/posts/${post.slug}`)}>

      {/* Cover Image */}
      {post.coverImage?.url ? (
        <img
          src={post.coverImage.url}
          alt={post.title}
          className="post-card-image"
        />
      ) : (
        <div className="post-card-image placeholder">✍️</div>
      )}

      <div className="post-card-body">

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="post-card-tags">
            {post.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Title */}
        <div className="post-card-title">{post.title}</div>

        {/* Excerpt */}
        <div className="post-card-excerpt">{getExcerpt(post.body)}</div>

        {/* Footer — author + stats */}
        <div className="post-card-footer">
          <div className="post-card-author">
            <img
              src={post.author?.avatar}
              alt={post.author?.name}
              className="avatar"
              onError={(e) => e.target.style.display = 'none'} // hide broken avatar
            />
            <span>{post.author?.name}</span>
            <span style={{ color: '#9ca3af', fontWeight: 400 }}>
              · {formatDate(post.createdAt)}
            </span>
          </div>

          <div className="post-card-stats">
            <span>❤️ {post.likes?.length || 0}</span>
            <span>💬 {post.commentCount || 0}</span>
            <span>👁️ {post.views || 0}</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PostCard;