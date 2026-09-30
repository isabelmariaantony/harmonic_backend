# Harmonic Backend

PhonoCare is a machine-learning application developed to detect heart murmurs from phonocardiogram (PCG) audio recordings. This repository contains the backend responsible for receiving uploaded audio files, connecting the application to the trained MATLAB classification model, and returning prediction results to the frontend.

The underlying ML pipeline was developed using the PhysioNet/CinC 2016 and CirCor DigiScope heart-sound datasets and explores multiple classification approaches for distinguishing normal and abnormal heart sounds.

## Features

- User authentication and authorization
- Forum posts and discussions
- Community events management
- Internship and volunteering opportunities
- Learning resources sharing
- Study session coordination

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a PostgreSQL database named `harmonic_db`

4. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   DB_USER=your_db_user
   DB_HOST=localhost
   DB_NAME=harmonic_db
   DB_PASSWORD=your_db_password
   DB_PORT=5432
   JWT_SECRET=your_jwt_secret
   ```

5. Run database migrations:
   ```bash
   psql -U your_db_user -d harmonic_db -f db/schema.sql
   ```

## Development

Start the development server:
```bash
npm run dev
```

## Production

Build the TypeScript code:
```bash
npm run build
```

Start the production server:
```bash
npm start
```

## API Endpoints

### Authentication
- POST /api/auth/register - Register a new user
- POST /api/auth/login - Login user

### Users
- GET /api/users/profile - Get user profile
- PUT /api/users/profile - Update user profile
- GET /api/users/:id - Get user by ID

### Posts
- GET /api/posts - Get all posts
- POST /api/posts - Create a new post
- GET /api/posts/:id - Get post by ID
- PUT /api/posts/:id - Update post
- DELETE /api/posts/:id - Delete post

### Events
- GET /api/events - Get all events
- POST /api/events - Create a new event
- GET /api/events/:id - Get event by ID
- PUT /api/events/:id - Update event
- DELETE /api/events/:id - Delete event
- POST /api/events/:id/register - Register for event

### Internships
- GET /api/internships - Get all internships
- POST /api/internships - Create a new internship
- GET /api/internships/:id - Get internship by ID
- PUT /api/internships/:id - Update internship
- DELETE /api/internships/:id - Delete internship

### Resources
- GET /api/resources - Get all resources
- POST /api/resources - Create a new resource
- GET /api/resources/:id - Get resource by ID
- PUT /api/resources/:id - Update resource
- DELETE /api/resources/:id - Delete resource

### Study Sessions
- GET /api/study-sessions - Get all study sessions
- POST /api/study-sessions - Create a new study session
- GET /api/study-sessions/:id - Get study session by ID
- PUT /api/study-sessions/:id - Update study session
- DELETE /api/study-sessions/:id - Delete study session
- POST /api/study-sessions/:id/join - Join study session
- DELETE /api/study-sessions/:id/leave - Leave study session

## Testing

Run tests:
```bash
npm test
```

## License

MIT 
