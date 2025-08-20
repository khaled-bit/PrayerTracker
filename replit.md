# Prayer Tracker App

## Overview

A web-based Islamic prayer tracking application that helps users monitor their daily prayers, earn points based on punctuality, and achieve monthly rewards. The app promotes consistency in prayer through gamification elements including leaderboards, streaks, and achievements.

The application tracks five daily prayers (Fajr, Dhuhr, Asr, Maghrib, Isha) with a points-based system that rewards punctuality (5 points for on-time prayers, 1 point for late prayers). Users can view their progress, compete on leaderboards, and receive notifications for missed prayers.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom Islamic-themed color palette (green, gold, cream)
- **State Management**: TanStack Query for server state, React Context for authentication
- **Routing**: Wouter for client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Authentication**: Passport.js with local strategy using session-based auth
- **Session Storage**: PostgreSQL sessions via connect-pg-simple
- **Password Security**: Node.js crypto module with scrypt hashing
- **API Design**: RESTful endpoints with proper error handling

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless PostgreSQL
- **Schema**: Normalized tables for users, prayers, user_prayers, daily_streaks, monthly_rewards, and notifications
- **Migrations**: Drizzle Kit for schema management

### Key Data Models
- **Users**: Profile information (name, age, email, hashed password)
- **Prayers**: Reference data for the five daily prayers with scheduled times
- **User Prayers**: Logs of completed prayers with timestamps and point awards
- **Daily Streaks**: Tracks consecutive days of complete prayer completion
- **Leaderboards**: Monthly ranking system based on total points earned

### Authentication & Authorization
- **Strategy**: Session-based authentication with secure HTTP-only cookies
- **Security**: Password hashing with salt, CSRF protection via same-origin policy
- **Session Management**: PostgreSQL-backed session store with 7-day expiry
- **Route Protection**: Middleware-based authentication checks for API endpoints

### Points & Gamification System
- **Scoring**: 5 points for on-time prayers, 1 point for late prayers
- **Streaks**: Daily streak tracking for users who complete all 5 prayers
- **Leaderboards**: Monthly rankings with pagination and user statistics
- **Achievements**: Reward system with user-suggested monthly rewards

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket support
- **Drizzle ORM**: Type-safe database operations and schema management

### UI & Styling
- **Radix UI**: Headless UI components for accessibility and customization
- **Tailwind CSS**: Utility-first CSS framework with custom Islamic theming
- **Lucide React**: Icon library with prayer-themed icons

### Development Tools
- **Vite**: Fast build tool with HMR and TypeScript support
- **TypeScript**: Static typing for both frontend and backend code
- **ESBuild**: Fast JavaScript bundler for production builds

### Authentication & Security
- **Passport.js**: Authentication middleware with local strategy
- **express-session**: Session management with PostgreSQL storage
- **bcrypt**: Password hashing library (via @types/bcrypt)

### State Management & API
- **TanStack Query**: Server state management with caching and synchronization
- **Wouter**: Lightweight client-side routing
- **React Hook Form**: Form validation with Zod schema integration

The application follows a traditional MVC pattern with clear separation between frontend React components, backend Express routes, and PostgreSQL database layer. The Islamic theme is implemented through custom CSS variables and Arabic font support for prayer names.