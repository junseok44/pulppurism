# Overview

This is a Korean civic engagement platform (주민참여 플랫폼) that enables citizens to submit opinions, vote on agendas, and participate in local governance. The platform features a public-facing interface for residents to browse agendas, submit opinions, and vote, along with an administrative dashboard for managing content, clustering opinions into agendas, and moderating community contributions.

The application is built as a full-stack TypeScript project with React on the frontend and Express on the backend, using Material Design principles adapted for Korean audiences with accessibility and trust as core values.

# Recent Changes

## November 10, 2025 - Schema Simplification and Admin Dashboard Completion

**Schema Changes:**
- Removed `categoryId` from opinions table - opinions no longer have categories, only agendas do
- Removed `status` field from opinions table - all submitted opinions are automatically eligible for clustering
- Simplified opinion workflow: submit → cluster → agenda (no approval/rejection workflow)
- Unclustered opinions are identified by absence in `opinionClusters` table rather than status field

**Admin Dashboard Migration:**
Completed migration of all admin dashboard pages from mock data to live API integration:

**Backend APIs Added:**
- GET /api/stats/dashboard - Dashboard statistics (today/weekly new opinions/users, active agendas, pending reports, recent clusters)
- GET /api/users - User list with filtering and pagination support
- PATCH /api/users/:id - User profile updates
- POST /api/dev/seed-opinions - Development tool to generate test opinions optimized for clustering tests

**Test Data Generation:**
- Creates 54 test opinions via POST /api/dev/seed-opinions
- 6 clusterable groups with 6 similar opinions each (주차 문제, 놀이터 안전, 가로등, 쓰레기 분리수거, 버스 배차, 도서관 운영)
- 18 standalone opinions on diverse topics (unclustered by design)
- Optimized for realistic clustering algorithm testing

**Frontend Pages Updated:**
- AdminDashboardHome - Real-time statistics, recent clusters, pending reports, and test data generation button
- ReportManagement - Opinion and agenda report handling with status updates
- AllAgendasManagement - Agenda list with search, filtering, and deletion
- CategoryManagement - Read-only category display with agenda counts
- AdminUsersPage - User list with search and provider statistics

All pages now use React Query for server state management with proper loading states, error handling, and cache invalidation.

**Known Limitations:**
- Comment-level reports not supported (schema limitation - backlog item)
- Categories are read-only (11 predefined categories) and only used for agendas, not opinions

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite as the build tool and development server.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router.

**UI Components**: shadcn/ui component library (New York variant) built on Radix UI primitives, providing accessible and customizable components with Tailwind CSS styling.

**State Management**: TanStack Query (React Query) for server state management, with custom query client configuration for API interactions.

**Styling**: Tailwind CSS with custom design system extending Material Design principles. Custom CSS variables define a comprehensive color system supporting light/dark modes, with specific Korean typography using Noto Sans KR and Inter fonts.

**Design System**: Custom spacing scale, border radius values, and elevation system using hover/active states (hover-elevate, active-elevate-2 classes) for interactive feedback.

## Backend Architecture

**Server Framework**: Express.js with TypeScript, using ES modules.

**Database ORM**: Drizzle ORM configured for PostgreSQL with Neon serverless adapter for connection pooling.

**API Pattern**: RESTful API structure with routes prefixed under `/api`. The storage interface pattern separates data access logic, using database-backed storage (DatabaseStorage) with PostgreSQL via Drizzle ORM. Query optimization uses JOIN operations to prevent N+1 query problems, with user data eagerly loaded in single database queries.

**Development Setup**: Vite middleware integration for HMR in development, with separate build process for production using esbuild to bundle the server.

**Authentication**: OAuth-based authentication using Passport.js with Google and Kakao strategies. Session management via express-session with connect-pg-simple for PostgreSQL-backed session storage. OAuth providers are conditionally enabled based on environment variables, allowing graceful degradation when credentials are not configured.

**Session Management**: Infrastructure present for connect-pg-simple session storage (PostgreSQL-backed sessions).

## Database Schema

**ORM**: Drizzle ORM with PostgreSQL dialect, schema defined in `shared/schema.ts`.

**Current Schema**: Comprehensive schema for civic engagement platform including:
- Users: OAuth authentication with Google and Kakao support (fields: googleId, kakaoId, provider enum), plus user profile data (username, email, displayName, avatarUrl)
- Categories: 11 predefined categories (교육, 교통, 환경, 안전, 복지, 문화, 경제, 보건, 주거, 행정, 기타) - used for agendas only
- Opinions: Citizen submissions with text/voice support and like counts - all opinions are automatically eligible for clustering
- Agendas: Discussion topics with voting periods, view counts, category assignment, and status management
- Votes: One vote per user per agenda with support for agree/disagree/neutral positions
- Clusters: AI-generated opinion groupings with similarity scores, can be linked to agendas
- OpinionClusters: Many-to-many relationship between opinions and clusters
- Reports: Content moderation system for flagging inappropriate content (opinions and agendas only)
- OpinionLikes: User likes on opinions with duplicate prevention
- AgendaBookmarks: User bookmarks on agendas with duplicate prevention
- Comments: Single-level comments on opinions with edit/delete support and author-only permissions

Schema uses Drizzle's type inference for compile-time safety, Zod integration for validation, and composite unique constraints to prevent duplicate votes/likes/bookmarks.

**Migration Strategy**: Drizzle Kit configured for schema migrations with output to `./migrations` directory.

## Key Architectural Decisions

**Monorepo Structure**: Single repository with client, server, and shared code organized in separate directories. Shared schema and types accessible to both frontend and backend via TypeScript path aliases.

**Database Connection**: Neon serverless PostgreSQL with WebSocket support for efficient connection management in serverless environments.

**Type Safety**: End-to-end TypeScript with shared types between client and server, Drizzle schema types, and Zod validation schemas derived from database schema.

**Mobile-First Design**: Responsive layout with dedicated mobile navigation component, separate from desktop header navigation. Tailwind breakpoints used for adaptive layouts.

**Component Organization**: Feature-based component structure with reusable UI components, page components, admin-specific components, and example components for documentation/testing.

**Internationalization Consideration**: Korean language as primary interface language, with fonts and typography optimized for Korean text rendering (Noto Sans KR primary, Inter for Latin characters).

# External Dependencies

## Database

**Neon PostgreSQL**: Serverless PostgreSQL database accessed via `@neondatabase/serverless` package with connection pooling. Database URL configured via `DATABASE_URL` environment variable.

## UI Libraries

**Radix UI**: Comprehensive set of unstyled, accessible UI primitives (@radix-ui/* packages) forming the foundation of the component library.

**shadcn/ui**: Pre-built component implementations using Radix UI primitives with Tailwind styling.

**Lucide React**: Icon library for consistent iconography throughout the application.

## Development Tools

**Replit Integration**: Custom Vite plugins for Replit-specific features including runtime error overlay, cartographer, and dev banner (conditionally loaded in development).

**TanStack Query DevTools**: Available for debugging server state and cache inspection.

## Form Handling

**React Hook Form**: Form state management with `@hookform/resolvers` for schema validation integration.

**Zod**: Schema validation library, integrated with Drizzle for type-safe validation derived from database schemas.

## Utilities

**date-fns**: Date manipulation and formatting library for Korean locale support.

**clsx + tailwind-merge**: Utility for conditional className composition with Tailwind class conflict resolution.

**class-variance-authority**: Type-safe variant API for component styling.

## AI Integration

**OpenAI**: AI-powered opinion clustering using:
- text-embedding-3-small for semantic similarity analysis
- gpt-4o-mini for cluster title and summary generation
- Cosine similarity matching for grouping related opinions
- Automatic cluster generation via API endpoint (/api/clusters/generate)