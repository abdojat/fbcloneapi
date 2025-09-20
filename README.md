# Facebook‑style Backend API (fbclone)

A modular, production-ready backend API built with Node.js, Express and MongoDB that implements core social features: user authentication, posts, likes, comments, friend management, notifications, and real-time chat via Socket.IO. It is designed to serve a web or mobile client implementing a Facebook-like experience.

Key features

- User registration, login, logout and profile management
- Password hashing, history tracking and change endpoint
- Create, update, delete posts with images
- Like/unlike and comment on posts
- Save/unsave posts and fetch saved posts
- Friend requests, accept/reject, cancel and remove friends
- Notifications stored in MongoDB and pushed in real-time via Socket.IO
- Real-time chat with message persistence and read receipts
- Cloudinary integration for image uploads

Tech stack

- Node.js (Express)
- MongoDB (Mongoose)
- Socket.IO for real-time features
- Cloudinary for image storage
- Passport Google OAuth (optional third-party auth wiring present)
- Other utility libraries: bcryptjs, jsonwebtoken, multer, cors, dotenv, morgan, axios

Repository layout

- `app.js` — Express app configuration, middleware and routes
- `server.js` — HTTP server, Socket.IO setup and real-time event handlers
- `config/` — configuration helpers (MongoDB, Cloudinary)
- `controllers/` — request handlers grouped by domain (users, posts, friends, notifications, chat)
- `models/` — Mongoose models (User, Post, Message, Notification, Token)
- `routes/` — Express routers mounted under `/api/*`
- `middlewares/` — authorization middleware

Getting started

Prerequisites

- Node.js 18+ and npm
- A running MongoDB instance or MongoDB Atlas cluster
- A Cloudinary account (if you need image upload functionality)

Install

1. Clone the repository and change to the project directory

2. Install dependencies

3. Create a `.env` file in the project root with the variables described below

Environment variables

The application expects the following environment variables:

- `PORT` — (optional) port to run the server, defaults to `5000`
- `MONGOURLI` — MongoDB connection string (required)
- `JWT_SECRET` — secret key used for signing JWTs (required)
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name (required for uploads)
- `CLOUDINARY_API_KEY` — Cloudinary API key (required for uploads)
- `CLOUDINARY_API_SECRET` — Cloudinary API secret (required for uploads)
- `NODE_ENV` — `development` or `production` (affects error output)

Start the server

In development you can use `nodemon` (devDependency is included):

The server listens on `PORT` (or 5000). Socket.IO is initialized in `server.js` and configured to accept connections from any origin.

API overview

Base URL: `/api`

Authentication

- `POST /api/users/register` — Register a new user. Body: `{ firstName, lastName, username, email, password }`. Returns `{ user, token }`.
- `POST /api/users/login` — Login. Body: `{ email, password }`. Returns `{ user, token }`.
- `POST /api/users/logout` — Logout (requires `Authorization: Bearer <token>`). Invalidates token by storing it in a Token collection.
- Auth middleware uses JWT in `Authorization` header. Include `Authorization: Bearer <token>` for protected routes.

User endpoints (selection)

- `GET /api/users/me` — Get current authenticated user.
- `POST /api/users/change-password` — Change password (requires current and new password).
- `GET /api/users/:id` — Get public profile by user id.
- `PUT /api/users/:id` — Update user info (protected).
- `GET /api/users/saved-posts` — Get saved posts for current user.
- `POST /api/users/save-post/:id` — Save a post to current user.
- `POST /api/users/unsave-post/:id` — Unsave a post.
- `GET /api/users/search?q=term` — Search users by username (protected).

Post endpoints (selection)

- `POST /api/posts` — Create a post (protected). Body: `{ content, imageUrls? }`.
- `GET /api/posts` — Get all posts.
- `GET /api/posts/friends` — Get posts from friends (protected).
- `GET /api/posts/:id` — Get a single post.
- `PUT /api/posts/:id` — Update a post (author-only).
- `DELETE /api/posts/:id` — Delete a post (author-only).
- `POST /api/posts/:id/like` — Like a post (protected).
- `POST /api/posts/:id/unlike` — Unlike a post (protected).
- `POST /api/posts/:id/comment` — Add comment to a post (protected).

Friend and notification endpoints (selection)

- `POST /api/friends` — Single endpoint `handelActions` for friend actions: send, accept, reject, cancel and remove. Body: `{ targetUserId, action, requestId? }`.
- `GET /api/friends/requests` — Get incoming friend requests (protected).
- `GET /api/friends/sent` — Get sent friend requests (protected).
- `GET /api/friends` — Get friends for current user (protected).
- `GET /api/friends/suggestions` — Get friend suggestions (protected).
- `GET /api/notification` — Get notifications (protected).
- `POST /api/notification/mark-all-read` — Mark notifications as read.
- `POST /api/notification/:id/read` — Mark a single notification as read.

File upload

- The project uses Cloudinary with `multer-storage-cloudinary`. The upload router (`/api/upload`) is configured to parse multipart requests and push files to Cloudinary.

WebSockets (Socket.IO)

Socket events (server-side handlers are defined in `server.js` and `controllers/notificationController.js`):

- Connection: clients should connect to the Socket.IO server used by the app server.
- `join` — client sends userId to mark user as online.
- `getOnlineUsers` — request current online users list.
- `sendMessage` — payload: `{ sender, recipient, text, timestamp }`. Server persists the message and emits `receiveMessage` to the recipient if online. Also creates a notification.
- `receiveMessage` — emitted to recipient with the new message.
- `markAsRead` — mark messages and notifications between two users as read; emits `readReceipt` back to sender.
- `typing` / `stopTyping` — typing indicators forwarded to recipient.
- `onlineUsers` — server emits updated array of online user IDs when users connect/disconnect.

Environment and deployment notes

- Ensure `MONGOURLI` and `JWT_SECRET` are set in production. Restrict CORS to your client domain(s) when deploying.
- Consider rotating `JWT_SECRET` and limiting token lifetime for improved security.

Testing

- There are currently no automated tests in the repository. Add unit and integration tests using Jest or Mocha + Supertest for the main routes and controllers.

Contributing

- Contributions are welcome. Open issues and pull requests are accepted. Please follow standard GitHub contribution practices: create a branch, run lint/tests locally, and submit a PR with a clear description.

License

This project is provided under the ISC license as declared in `package.json`.

Acknowledgements

- Built with popular open-source libraries: Express, Mongoose, Socket.IO, Cloudinary, Passport, and more.
