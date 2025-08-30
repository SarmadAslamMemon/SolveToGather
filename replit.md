# Community Platform React Application

## Overview

This is a community platform built with React and Express.js that enables users to participate in community-driven issues and fundraising campaigns. The platform supports role-based access with three user types: Super Users (admins), Community Leaders, and Normal Users. Users can create and interact with community issues, participate in fundraising campaigns, and make donations through integrated payment methods.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern React patterns
- **Vite** as the build tool for fast development and optimized production builds
- **Tailwind CSS** for utility-first styling with custom CSS variables for theming
- **shadcn/ui** components built on Radix UI primitives for consistent design system
- **Framer Motion** for smooth animations and transitions
- **Wouter** for lightweight client-side routing
- **TanStack React Query** for server state management and caching

### Backend Architecture
- **Express.js** server with TypeScript for API endpoints
- **PostgreSQL** database with **Drizzle ORM** for type-safe database operations
- **Neon Database** as the serverless PostgreSQL provider
- In-memory storage interface for development with extensible storage abstraction
- RESTful API design with `/api` prefix for all backend routes

### Authentication & Authorization
- **Firebase Authentication** for user management and secure login/registration
- **Firebase Firestore** for real-time data synchronization
- **Firebase Storage** for file uploads (profile images, issue images, campaign images)
- Role-based access control with three distinct user roles:
  - Super User: Full administrative access
  - Community Leader: Can create issues and campaigns
  - Normal User: Can view, like, comment, and donate

### Database Schema
The application uses a hybrid approach with both PostgreSQL (via Drizzle) and Firebase Firestore:

**PostgreSQL Tables (Drizzle):**
- `users` - User profiles with roles and community associations
- `communities` - Community management with leaders and member counts
- `issues` - Community issues with engagement metrics
- `campaigns` - Fundraising campaigns with goals and progress tracking
- `donations` - Payment transaction records

**Firebase Collections:**
- Real-time synchronization for live updates
- File storage for images and media
- Authentication state management

### Payment Integration
- **JazzCash** and **EasyPaisa** integration for local Pakistani payment methods
- **Bank Transfer** support as additional payment option
- Transaction fee calculation with minimum fee enforcement
- Payment status tracking and confirmation workflows

### State Management
- **React Context** for authentication state and theme management
- **TanStack React Query** for server state caching and synchronization
- **Firebase real-time subscriptions** for live data updates
- Local state management with React hooks for component-level state

### Development & Build Tools
- **TypeScript** for static type checking across the entire stack
- **ESBuild** for fast backend bundling in production
- **Vite** for frontend development and production builds
- **PostCSS** with Autoprefixer for CSS processing
- **Drizzle Kit** for database migrations and schema management

## External Dependencies

### Core Technologies
- **Firebase** (Authentication, Firestore, Storage) - User management and real-time data
- **Neon Database** - Serverless PostgreSQL hosting
- **Vercel/Replit** deployment platform integration

### UI & Styling
- **Radix UI** - Accessible component primitives
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **Framer Motion** - Animation library

### Development Tools
- **Drizzle ORM** - Type-safe database operations
- **TanStack React Query** - Server state management
- **Zod** - Runtime type validation
- **React Hook Form** - Form state management

### Payment Providers
- **JazzCash API** - Mobile wallet payments
- **EasyPaisa API** - Mobile wallet payments
- Banking integration APIs for direct transfers

The architecture emphasizes type safety, real-time capabilities, and scalable design patterns while maintaining a clean separation between frontend and backend concerns.