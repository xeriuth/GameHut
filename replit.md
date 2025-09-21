# GameVerse - Gaming Social Platform

## Overview

GameVerse is a social platform designed for gamers to connect, share achievements, and build gaming communities. The application features a comprehensive social gaming experience with user profiles, game libraries, communities, friends systems, and real-time interactions. Built as a full-stack web application, it combines a React frontend with an Express backend, using PostgreSQL for data persistence and Replit's authentication system for user management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component development
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessibility
- **Styling**: Tailwind CSS with custom design tokens for consistent theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful endpoints with consistent error handling and logging middleware
- **Authentication**: Replit's OpenID Connect (OIDC) authentication system with Passport.js
- **Session Management**: Express sessions with PostgreSQL session store using connect-pg-simple

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver for scalable cloud deployment
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Schema Validation**: Zod schemas integrated with Drizzle for runtime type checking
- **Database Schema**: Comprehensive relational design supporting users, games, communities, posts, friendships, and gamification features

### Authentication and Authorization
- **Provider**: Replit's OIDC authentication system for seamless platform integration
- **Session Storage**: Secure server-side sessions stored in PostgreSQL
- **Middleware**: Custom authentication middleware for protecting API routes
- **User Management**: Automatic user creation and profile management through OIDC claims

### Key Data Models
- **Users**: Profile management with gaming platform integrations, XP system, and social features
- **Games**: Centralized game database with metadata and user associations
- **Communities**: Game-specific groups with membership and moderation systems
- **Posts**: Social feed with rich content, comments, and engagement features
- **Friendships**: Bilateral relationship system with online status tracking
- **Notifications**: Real-time user engagement and activity updates

### Component Architecture
- **Layout Components**: Consistent sidebar navigation, top bar, and right sidebar for activity feeds
- **Feature Components**: Modular post creation, user avatars, game tags, and XP progress bars
- **UI Components**: Comprehensive design system with accessible form controls and interactive elements
- **Hooks**: Custom React hooks for authentication state and mobile responsiveness

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL database connection with WebSocket support
- **drizzle-orm**: Type-safe ORM with PostgreSQL dialect for database operations
- **drizzle-kit**: CLI tools for database migrations and schema management

### Authentication & Session
- **openid-client**: OpenID Connect client for Replit authentication
- **passport**: Authentication middleware with OpenID Connect strategy
- **express-session**: Session management with PostgreSQL persistence
- **connect-pg-simple**: PostgreSQL session store adapter

### Frontend Libraries
- **@tanstack/react-query**: Server state management and data fetching
- **@radix-ui/react-***: Accessible UI component primitives
- **wouter**: Lightweight React router for client-side navigation
- **@hookform/resolvers**: Form validation with React Hook Form integration

### Development Tools
- **vite**: Modern build tool with HMR and optimization
- **@replit/vite-plugin-***: Replit-specific development enhancements
- **tailwindcss**: Utility-first CSS framework
- **typescript**: Static type checking for enhanced developer experience

### Utility Libraries
- **date-fns**: Date manipulation and formatting utilities
- **clsx**: Conditional CSS class name utility
- **nanoid**: Secure URL-friendly unique ID generation
- **zod**: Runtime type validation and schema definition