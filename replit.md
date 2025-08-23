# E-commerce Product Management System

## Overview

This is a full-stack e-commerce application built with Express.js, React, and PostgreSQL. The system provides a customer-facing storefront for browsing and ordering products, along with an admin panel for managing inventory, orders, and delivery pricing. The application is specifically designed for the Algerian market, featuring province-based (wilaya) delivery pricing and localized content.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management, local state for cart functionality
- **Routing**: Wouter for lightweight client-side routing
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Server**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Session-based authentication using express-session with PostgreSQL storage
- **API Design**: RESTful API with separate routes for public and admin endpoints
- **Error Handling**: Centralized error handling middleware

### Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless hosting
- **Session Storage**: PostgreSQL sessions table for authentication persistence
- **Schema Management**: Drizzle migrations for database versioning
- **Connection Pooling**: Neon serverless connection pooling for optimal performance

### Authentication and Authorization
- **Admin Authentication**: Session-based with bcrypt password hashing
- **Session Management**: PostgreSQL-backed sessions with configurable TTL
- **Route Protection**: Middleware-based authentication checks for admin endpoints
- **Security**: HTTP-only cookies, CSRF protection considerations

### Key Data Models
- **Products**: Inventory management with categories, pricing, stock levels, and active status
- **Orders**: Complete order lifecycle with customer information, items, and status tracking
- **Wilayas**: Algerian provinces with customizable delivery pricing
- **Admins**: Administrative users with email/password authentication

### External Dependencies

- **Database**: Neon PostgreSQL serverless database
- **UI Components**: Radix UI primitives through shadcn/ui
- **Fonts**: Google Fonts integration (Inter, Architects Daughter, DM Sans, Fira Code, Geist Mono)
- **Development**: Replit-specific tooling and error overlay for development environment
- **Build Tools**: ESBuild for server bundling, Vite for client bundling

### Architecture Decisions

**Monorepo Structure**: Single repository with separate client, server, and shared directories for type safety and code reuse across frontend and backend.

**Session vs JWT Authentication**: Sessions chosen for better security with automatic expiration and server-side revocation capabilities, stored in PostgreSQL for scalability.

**Drizzle ORM**: Selected for excellent TypeScript integration, migration system, and performance over alternatives like Prisma for this use case.

**Separate Admin Interface**: Admin functionality isolated in dedicated routes and components to maintain clear separation of concerns and security boundaries.

**Province-based Delivery**: Custom wilaya system designed specifically for Algerian market requirements with flexible delivery pricing per region.

**Real-time Cart Management**: Client-side cart state with localStorage persistence to maintain shopping experience across sessions without requiring user authentication.