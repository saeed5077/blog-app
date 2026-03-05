# ✍️ Blog Platform
> Project 2 of 5 — MERN Stack Learning Series

A full-featured Medium-like blog platform built with the MERN stack. Features rich text editing, image uploads, nested comments, role-based access control, and production-grade security.

---

## 🚀 Features

- User authentication with JWT (15 minute expiry)
- Role-based access control (user / admin)
- Create, edit, delete blog posts with rich text editor (React Quill)
- Cover image upload via Cloudinary (auto-resized to 1200x630)
- SEO-friendly slugs for post URLs
- Post search and pagination
- Like / unlike posts
- Nested comments with replies
- Admin can delete any post or comment
- View count tracking per post
- Production-grade security (helmet, mongoSanitize, xss-clean, rate limiting)

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| Express | Web framework |
| MongoDB + Mongoose | Database + ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT auth tokens |
| multer | File upload handling |
| cloudinary | Cloud image storage |
| multer-storage-cloudinary | Direct multer → cloudinary pipeline |
| slugify | SEO-friendly URL generation |
| helmet | Security HTTP headers |
| express-mongo-sanitize | NoSQL injection prevention |
| xss-clean | XSS attack prevention |
| express-rate-limit | Brute force prevention |
| dotenv | Environment variables |
| cors | Cross-origin requests |

### Frontend
| Package | Purpose |
|---|---|
| React | UI framework |
| React Router DOM | Client-side routing |
| Axios | HTTP requests |
| React Quill | Rich text editor |
| Context API | Global auth state |

---

## 📁 Project Structure

```
blog-app/
├── server/
│   ├── middleware/
│   │   └── authMiddleware.js   # protect + authorize (RBAC)
│   ├── models/
│   │   ├── User.js             # pre-save hook, instance methods, select:false
│   │   ├── Post.js             # slug generation, virtual commentCount
│   │   └── Comment.js          # self-referencing for nested replies
│   ├── routes/
│   │   ├── auth.js             # register, login, /me, updatepassword
│   │   ├── posts.js            # CRUD, pagination, search, like toggle
│   │   └── comments.js         # create, get nested, delete, like
│   ├── utils/
│   │   └── cloudinary.js       # cloudinary config + multer storage
│   ├── .env
│   └── server.js               # security middleware stack + global error handler
└── client/
    └── src/
        ├── components/
        │   ├── Navbar.js           # guest vs logged in state
        │   ├── PostCard.js         # card with excerpt, stats, author
        │   └── ProtectedRoute.js
        ├── context/
        │   └── AuthContext.js
        ├── pages/
        │   ├── Home.js             # grid, search, pagination
        │   ├── Login.js
        │   ├── Register.js
        │   ├── SinglePost.js       # full post, likes, nested comments
        │   ├── CreatePost.js       # react-quill + image upload
        │   └── EditPost.js         # pre-filled form + existing image
        ├── api.js
        └── App.js
```

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Cloudinary account (free tier)

### 1. Install backend dependencies
```bash
cd server
npm install
```

### 2. Configure environment variables
Create `server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string/blogdb?retryWrites=true&w=majority
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=15m

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 3. Install and run frontend
```bash
cd client
npm install
npm start
```

### 4. Run backend
```bash
cd server
npm run dev
```

---

## 🔌 API Reference

### Auth Routes — `/api/auth`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| GET | `/me` | Get current user | ✅ |
| PUT | `/updatepassword` | Update password | ✅ |

### Post Routes — `/api/posts`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/` | Get all posts (paginated) | No |
| GET | `/:slug` | Get single post + comments | No |
| POST | `/` | Create post (multipart/form-data) | ✅ |
| PUT | `/:id` | Update post | ✅ Owner/Admin |
| DELETE | `/:id` | Delete post + comments | ✅ Owner/Admin |
| PUT | `/:id/like` | Toggle like | ✅ |

**Query parameters for GET /api/posts:**
```
?page=1          pagination page number
?limit=10        posts per page
?search=react    search in title and body
?tag=javascript  filter by tag
```

### Comment Routes — `/api/comments`

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/` | Create comment or reply | ✅ |
| GET | `/post/:postId` | Get nested comments for post | No |
| DELETE | `/:id` | Delete comment + replies | ✅ Owner/Admin |
| PUT | `/:id/like` | Toggle like on comment | ✅ |

**Create comment body:**
```json
{
  "body": "Great post!",
  "postId": "post_id_here",
  "parentId": "comment_id_here"  // optional — omit for top level comment
}
```

---

## 🔐 Security Layers

| Attack | Defense | Implementation |
|---|---|---|
| NoSQL Injection | express-mongo-sanitize | Strips `$` and `.` from all inputs |
| XSS Script Injection | xss-clean | Strips HTML/script tags from inputs |
| Brute Force | express-rate-limit | 100 requests per IP per 15 minutes |
| Insecure Headers | helmet | Sets 11 secure HTTP headers |
| Unauthorized Access | Ownership checks | Author ID vs logged in user ID |
| Password Exposure | select: false | Password never returned in queries |

---

## 💡 Key Concepts Learned

### Backend
- Mongoose pre-save hooks (auto hash passwords, auto generate slugs)
- Mongoose instance methods (`user.matchPassword()`)
- Mongoose virtual fields (`commentCount`)
- `select: false` for sensitive fields
- Role-based access control (RBAC) with middleware factory pattern
- File uploads with Multer + Cloudinary pipeline
- Pagination with skip/limit + Promise.all for parallel queries
- `populate()` for MongoDB relationships
- Self-referencing schemas (nested comments)
- Cascading deletes (post deleted → all comments deleted)
- Global error handler in Express
- `next(err)` pattern for centralized error handling

### Frontend
- `useParams()` for URL parameter extraction
- `dangerouslySetInnerHTML` for rendering rich text HTML
- `URL.createObjectURL()` for local image previews
- FormData for multipart file uploads
- Optimistic UI updates (like, comment, delete without refetch)
- `useRef` to prevent double API calls in React StrictMode
- Search with debounced pagination reset

### Security (Live Attack & Defense)
- Performed NoSQL injection attack and observed sanitization
- Performed XSS injection via blog post body
- Performed brute force attack and triggered rate limiting
- Performed unauthorized resource access (BOLA attack)
- Observed HTTP OPTIONS preflight requests (CORS)
- Understood localStorage XSS vulnerability

---

## 🌐 Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Server port (5000) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `JWT_EXPIRE` | Token expiry duration (15m) |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary account cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |

---

## 📸 Pages

| Route | Description | Access |
|---|---|---|
| `/` | Home — all posts with search + pagination | Public |
| `/login` | Login | Public |
| `/register` | Register | Public |
| `/posts/:slug` | Full post with comments | Public |
| `/posts/create` | Create new post | Protected |
| `/posts/edit/:id` | Edit existing post | Protected (owner/admin) |

---

## 🔍 Debugging Tools Used

| Tool | Purpose |
|---|---|
| Browser Network Tab | Inspect requests, responses, status codes, headers |
| Browser Console | Runtime errors, console.log output |
| React DevTools | Inspect component state and props in real time |
| Thunder Client | Test API routes independently from frontend |
| MongoDB Atlas UI | Verify data saved correctly in database |
| Terminal logs | Backend console.log for route-level debugging |
