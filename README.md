# Harmonic Community Platform 

A platform connecting volunteers with those in need, powered by AI. This platform helps students, individuals with special needs, elderly, and Alzheimer's patients through AI-powered tools and volunteer support.

## Features

- Volunteer registration and management
- AI-powered educational tools
- Resource hub for special needs support
- Interactive learning modules
- Community engagement features

## Tech Stack

- Backend: Node.js, Express.js
- Database: PostgreSQL
- AI Integration: OpenAI API
- Frontend: React (coming soon)

## Setup Instructions

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Set up PostgreSQL database
5. Start the development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
├── server.js          # Main server file
├── src/
│   ├── controllers/   # Route controllers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Business logic
│   ├── utils/         # Utility functions
│   └── middleware/    # Custom middleware
├── tests/             # Test files
└── public/            # Static files
```

## Contributing

Please read CONTRIBUTING.md for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE.md file for details. 
