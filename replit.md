# Overview

This project is a Korean civic engagement platform (주민참여 플랫폼) designed to empower citizens to submit opinions, vote on agendas, and actively participate in local governance. It provides a public-facing interface for residents to engage with local issues and an administrative dashboard for content management, opinion clustering into agendas, and moderation. The application is a full-stack TypeScript project utilizing React for the frontend and Express for the backend, adhering to Material Design principles adapted for a Korean audience with a strong emphasis on accessibility and trust.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Framework**: React 18 with TypeScript, using Vite.
**Routing**: Wouter.
**UI Components**: shadcn/ui (New York variant) built on Radix UI, styled with Tailwind CSS.
**State Management**: TanStack Query (React Query) for server state management.
**Styling**: Tailwind CSS with a custom design system extending Material Design principles, including a comprehensive color system for light/dark modes and Korean typography (Noto Sans KR, Inter fonts).
**Design System**: Custom spacing, border radius, and elevation system for interactive feedback.

## Backend Architecture

**Server Framework**: Express.js with TypeScript (ES modules).
**Database ORM**: Drizzle ORM for PostgreSQL, utilizing Neon serverless adapter.
**API Pattern**: RESTful API under `/api`, employing a storage interface pattern for data access. Query optimization uses JOINs to prevent N+1 issues.
**Development Setup**: Vite middleware for HMR in development; esbuild for production bundling.
**Authentication**: OAuth-based authentication via Passport.js (Google and Kakao strategies). Session management uses express-session with connect-pg-simple for PostgreSQL-backed storage.
**Session Management**: PostgreSQL-backed session storage via `connect-pg-simple`.

## Database Schema

**ORM**: Drizzle ORM with PostgreSQL dialect, schema defined in `shared/schema.ts`.
**Schema Overview**: Includes `Users`, `Categories` (11 predefined, for agendas only), `Opinions` (citizen submissions, automatically eligible for clustering), `Agendas`, `Votes`, `Clusters` (AI-generated opinion groupings), `OpinionClusters`, `Reports` (for opinions and agendas), `OpinionLikes`, `AgendaBookmarks`, and `Comments`.
**Validation**: Zod integration for validation and composite unique constraints to prevent duplicates.
**Migrations**: Drizzle Kit configured for schema migrations.

## Key Architectural Decisions

**Monorepo Structure**: Single repository with client, server, and shared code, leveraging TypeScript path aliases.
**Database Connection**: Neon serverless PostgreSQL with WebSocket support for efficient connection management.
**Type Safety**: End-to-end TypeScript with shared types, Drizzle schema types, and Zod validation.
**Mobile-First Design**: Responsive layout with dedicated mobile navigation and Tailwind breakpoints.
**Component Organization**: Feature-based component structure.
**Internationalization**: Primary language is Korean, with optimized typography (Noto Sans KR, Inter).

# External Dependencies

## Database

**Neon PostgreSQL**: Serverless PostgreSQL accessed via `@neondatabase/serverless`.

## UI Libraries

**Radix UI**: Unstyled, accessible UI primitives.
**shadcn/ui**: Pre-built components based on Radix UI with Tailwind CSS.
**Lucide React**: Icon library.

## Development Tools

**Replit Integration**: Custom Vite plugins for Replit-specific features.
**TanStack Query DevTools**: For debugging server state.

## Form Handling

**React Hook Form**: Form state management.
**Zod**: Schema validation, integrated with Drizzle.

## Utilities

**date-fns**: Date manipulation and formatting (Korean locale support).
**clsx + tailwind-merge**: Conditional className composition and Tailwind class conflict resolution.
**class-variance-authority**: Type-safe variant API for component styling.

## AI Integration

**OpenAI**: Used for opinion clustering:
- `text-embedding-3-small` for semantic similarity.
- `gpt-4o-mini` for cluster title and summary generation.
- Cosine similarity matching for grouping opinions.
- Automatic cluster generation via `/api/clusters/generate` endpoint.