# Overview

This is a Korean civic engagement platform (주민참여 플랫폼) that enables citizens to submit opinions, vote on agendas, and participate in local governance. The platform features a public-facing interface for residents to browse agendas, submit opinions, and vote, along with an administrative dashboard for managing content, clustering opinions into agendas, and moderating community contributions.

The application is built as a full-stack TypeScript project with React on the frontend and Express on the backend, using Material Design principles adapted for Korean audiences with accessibility and trust as core values.

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

**API Pattern**: RESTful API structure with routes prefixed under `/api`. The storage interface pattern separates data access logic, using database-backed storage (DatabaseStorage) with PostgreSQL via Drizzle ORM.

**Development Setup**: Vite middleware integration for HMR in development, with separate build process for production using esbuild to bundle the server.

**Session Management**: Infrastructure present for connect-pg-simple session storage (PostgreSQL-backed sessions).

## Database Schema

**ORM**: Drizzle ORM with PostgreSQL dialect, schema defined in `shared/schema.ts`.

**Current Schema**: Comprehensive schema for civic engagement platform including:
- Users: Authentication and user management (temporary user seeded: "temp-user-id")
- Categories: 11 predefined categories (교육, 교통, 환경, 안전, 복지, 문화, 경제, 보건, 주거, 행정, 기타)
- Opinions: Citizen submissions with text/voice support, status workflow (pending/approved/rejected), and like counts
- Agendas: Discussion topics with voting periods, view counts, and status management
- Votes: One vote per user per agenda with support for agree/disagree/neutral positions
- Clusters: AI-generated opinion groupings with similarity scores
- OpinionClusters: Many-to-many relationship between opinions and clusters
- Reports: Content moderation system for flagging inappropriate content
- OpinionLikes: User likes on opinions with duplicate prevention
- AgendaBookmarks: User bookmarks on agendas with duplicate prevention

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