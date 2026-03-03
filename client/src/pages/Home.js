import { useState, useEffect } from 'react';
import API from '../api';
import PostCard from '../components/PostCard';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch posts whenever page or search changes
  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page,
          limit: 9,
          ...(search && { search }) // only add search param if it has a value
        });

        const { data } = await API.get(`/posts?${params}`);
        setPosts(data.posts);
        setPagination(data.pagination);
      } catch (err) {
        setError('Failed to load posts');
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, [page, search]); // re-runs when page or search changes

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);          // reset to page 1 on new search
    setSearch(searchInput);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  // Build pagination page numbers
  const getPageNumbers = () => {
    const pages = [];
    for (let i = 1; i <= pagination.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="home-container">

      {/* Header */}
      <div className="home-header">
        <h1>Latest Posts</h1>

        {/* Search bar */}
        <form className="search-bar" onSubmit={handleSearch}>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search posts..."
          />
          <button type="submit">Search</button>
          {search && (
            <button
              type="button"
              onClick={handleClearSearch}
              style={{ background: '#6b7280' }}
            >
              Clear
            </button>
          )}
        </form>

        {/* Show active search */}
        {search && (
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Showing results for: <strong>"{search}"</strong>
            {' '}({pagination.totalPosts} found)
          </p>
        )}
      </div>

      {/* Posts Grid */}
      {loading ? (
        <div className="loading">Loading posts...</div>
      ) : error ? (
        <div className="error-msg">{error}</div>
      ) : posts.length === 0 ? (
        <div className="empty">
          <p style={{ fontSize: '3rem' }}>📭</p>
          <p>No posts found</p>
        </div>
      ) : (
        <div className="posts-grid">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={!pagination.hasPrevPage}
          >
            ← Prev
          </button>

          {getPageNumbers().map(num => (
            <button
              key={num}
              onClick={() => setPage(num)}
              className={page === num ? 'active' : ''}
            >
              {num}
            </button>
          ))}

          <button
            onClick={() => setPage(p => p + 1)}
            disabled={!pagination.hasNextPage}
          >
            Next →
          </button>
        </div>
      )}

    </div>
  );
};

export default Home;