# Explorely - Your Social Travel Companion 🌍✈️

https://github.com/Afaqhaider20/Explorely.git


## 📝 Project Overview

Explorely is a sophisticated social media platform specifically designed for the global travel community. It serves as a comprehensive solution for travelers to connect, share experiences, and plan their adventures together. The platform combines the best elements of social networking with practical travel planning tools, creating a unique ecosystem for travel enthusiasts.

## 🎯 Core Features

### Location Reviews & Insights
- Share detailed travel experiences and recommendations
- Upload and manage travel photos
- Rate and review destinations
- Create comprehensive travel guides

### Community Interaction
- Join topic-based travel forums
- Participate in destination-specific discussions
- Connect with like-minded travelers
- Share travel tips and advice

### Trip Planning & Collaboration
- Create and manage travel itineraries
- Invite friends to join trips
- Share trip expenses
- Coordinate travel schedules

### Smart Discovery
- Advanced search functionality for destinations
- Personalized travel recommendations
- Trending locations and experiences
- Verified traveler reviews

### Content Management
- Robust content moderation system
- User reporting mechanism
- Quality control for reviews
- Spam prevention

## 🏗️ Code Structure

### Frontend Architecture (Next.js 14)
The frontend is built using Next.js 14 with App Router, featuring a modern and maintainable structure:

#### Core Directories
- `/src/app` - Main application routes and layouts
  - `/(main)` - Protected main application routes
  - `/(admin)` - Admin dashboard and management
- `/src/components` - Reusable UI components
- `/src/lib` - Utility functions and services
- `/src/store` - State management (Zustand)
- `/src/utils` - Helper functions and constants

#### Key Features
- Server and Client Components
- Route Groups for better organization
- Dynamic Routes for posts and profiles
- API Integration Services
- Responsive Design with Tailwind CSS
- Component Library with Shadcn UI

### Backend Architecture (Node.js/Express)
The backend follows a modular and scalable architecture:

#### Core Directories
- `/routes` - API route definitions
  - `userRoutes.js` - User management and authentication
  - `postRoutes.js` - Post creation and management
  - `communityRoutes.js` - Community features
  - `reviewRoutes.js` - Review system
  - `searchRoutes.js` - Search functionality
  - `adminRoutes.js` - Admin panel features
- `/controllers` - Business logic implementation
- `/models` - Database schema definitions
- `/middleware` - Custom middleware functions
- `/utils` - Helper functions
- `/config` - Configuration files

#### Key Features
- RESTful API Design
- JWT Authentication
- MongoDB Integration
- Real-time Features with Socket.IO
- File Upload Handling
- Error Handling Middleware
- Input Validation
- Rate Limiting

## 🛠️ Technical Stack

### Frontend Technologies
- **Framework**: Next.js with React
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI
- **State Management**: Zustand
- **Responsive Design**: Mobile-first approach

### Backend Technologies
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ORM**: Mongoose
- **Authentication**: JWT-based security

## 🔒 Security Features
- Secure JWT-based authentication
- Protected API routes
- Data encryption
- Input validation
- XSS protection

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation
1. Clone the repository
```bash
git clone https://github.com/Afaqhaider20/Explorely.git
```

2. Install dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

3. Set up environment variables

Create a `.env.local` file in the frontend directory:
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Create a `.env` file in the backend directory:
```bash
# Backend (.env)
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
```

4. Run the development servers
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000` and the backend at `http://localhost:5000`

## 📱 Platform Support
- Responsive web design
- Cross-browser compatibility
- Mobile-optimized interface
- Progressive Web App (PWA) support

## 🔄 Development Status
- Frontend: In Development
- Backend: In Development
- Deployment: Under Progress

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors
- **Afaq Haider** - *Initial work* - [GitHub Profile](https://github.com/Afaqhaider20)

## 🙏 Acknowledgments
- Inspired by platforms like Reddit and TripAdvisor
- Built with modern web technologies
- Community-driven development

---

⭐ Star this repository if you find it helpful!

[View Live Demo](https://explorely.me)
[Report Bug](https://github.com/Afaqhaider20/Explorely/issues)
[Request Feature](https://github.com/Afaqhaider20/Explorely/issues)

## 📁 Project Structure

### Frontend Implementation
```
frontend/
├── src/
│   ├── app/                      # Next.js 14 App Router
│   │   ├── (main)/              # Protected main routes
│   │   │   ├── explore/         # Explore page
│   │   │   ├── profile/         # User profiles
│   │   │   ├── posts/          # Post viewing/creation
│   │   │   ├── reviews/        # Travel reviews
│   │   │   └── search/         # Search functionality
│   │   └── (admin)/            # Admin dashboard
│   ├── components/              # Reusable components
│   │   ├── ui/                 # UI components (shadcn)
│   │   ├── PostCard.tsx        # Post display component
│   │   ├── ReviewCard.tsx      # Review display component
│   │   └── ProfileHeader.tsx   # Profile header component
│   ├── lib/                    # Core functionality
│   │   ├── services/          # API services
│   │   └── utils/             # Utility functions
│   ├── store/                  # State management
│   │   └── AuthContext.tsx     # Authentication context
│   └── utils/                  # Helper functions
```

### Backend Implementation
```
backend/
├── routes/                     # API Routes
│   ├── userRoutes.js          # User management
│   ├── postRoutes.js          # Post handling
│   ├── reviewRoutes.js        # Review system
│   ├── communityRoutes.js     # Community features
│   ├── searchRoutes.js        # Search functionality
│   └── adminRoutes.js         # Admin features
├── controllers/               # Business Logic
│   ├── userController.js      # User operations
│   ├── postController.js      # Post operations
│   └── reviewController.js    # Review operations
├── models/                    # Database Schemas
│   ├── User.js               # User model
│   ├── Post.js               # Post model
│   └── Review.js             # Review model
├── middleware/               # Custom Middleware
│   ├── auth.js              # Authentication
│   └── upload.js            # File upload handling
├── config/                  # Configuration
│   └── db.js               # Database configuration
└── utils/                  # Helper Functions
    └── validators.js       # Input validation
```

### Key Feature Implementations

#### Authentication System
- Frontend: `frontend/src/store/AuthContext.tsx`
- Backend: `backend/routes/userRoutes.js`, `backend/controllers/userController.js`

#### Post Management
- Frontend: `frontend/src/app/(main)/posts/[id]/page.tsx`
- Backend: `backend/routes/postRoutes.js`, `backend/controllers/postController.js`

#### Review System
- Frontend: `frontend/src/app/(main)/reviews/page.tsx`
- Backend: `backend/routes/reviewRoutes.js`, `backend/controllers/reviewController.js`

#### Search Functionality
- Frontend: `frontend/src/app/(main)/search/page.tsx`
- Backend: `backend/routes/searchRoutes.js`

#### Admin Dashboard
- Frontend: `frontend/src/app/(admin)/admin/page.tsx`
- Backend: `backend/routes/adminRoutes.js`

#### Community Features
- Frontend: `frontend/src/app/(main)/explore/page.tsx`
- Backend: `backend/routes/communityRoutes.js`

#### Real-time Features
- Backend: `backend/socket.js`
- Frontend: `frontend/src/hooks/useSocket.ts`


