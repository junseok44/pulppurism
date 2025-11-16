# Overview

This project is a Korean civic engagement platform (주민참여 플랫폼) designed to empower citizens to submit opinions, vote on agendas, and actively participate in local governance. It provides a public-facing interface for residents to engage with local issues and an administrative dashboard for content management, opinion clustering into agendas, and moderation. The application is a full-stack TypeScript project utilizing React for the frontend and Express for the backend, adhering to Material Design principles adapted for a Korean audience with a strong emphasis on accessibility and trust.

## Recent Updates (2024-11-16)
- **Admin Dashboard Analytics Enhancement**: Improved admin dashboard with enhanced analytics and insights
  - Replaced "오늘 신규 의견" card with "오늘의 주민 의견 동향" featuring weekly opinion trend bar chart
  - Chart highlights today's data in blue for easy identification
  - Removed "신규 가입자" card from main dashboard (retained in user management page)
  - Added new "활발한 안건" page (/admin/active-agendas) showing top 20 most active agendas
  - Activity scoring uses equal-weight formula: voteCount + commentCount + viewCount
  - Backend APIs added: `/api/admin/stats/weekly-opinions` (7-day opinion trends), `/api/admin/stats/active-agendas` (top active agendas)
- **Status Badge System Refactoring**: Completed comprehensive refactoring to remove "completed" status
  - Replaced single "completed" status with two distinct outcome statuses: `passed` (통과) and `rejected` (반려)
  - Final status set: `voting`, `reviewing`, `passed`, `rejected` (4 total statuses)
  - Centralized all status label and badge color logic in `client/src/lib/utils.ts`
  - Implemented color-coded status badges across all components:
    - **voting** (투표중): Blue badges
    - **reviewing** (검토중): Orange badges
    - **passed** (통과): Green badges
    - **rejected** (반려): Red badges
  - Updated all components to use centralized `getStatusLabel` and `getStatusBadgeClass` utilities
  - Refactored components: AgendaCard, OkAgendaCard, AllAgendasManagement, VotingAgendasPage, AgendaListPage, AgendaDetailPage
  - Enhanced Timeline component to dynamically show "통과" or "반려" as final step based on actual agenda status
  - Updated admin edit dialogs and status filters throughout the application
  - Database migration: Converted existing "completed" agendas to "passed" status
- **Random Spotlight Section**: Implemented dynamic spotlight feature on agenda list page
  - Randomly displays one of three sections on page load: voting (투표 진행 중), passed (통과 된 안건), or rejected (반려 된 안건)
  - Each section shows a curated selection of agendas with that status
  - "더보기" button applies status filter and smoothly scrolls to agenda list section

## Previous Updates (2024-11-15)
- **Reference Materials Enhancement**: Reorganized agenda reference materials into 4 distinct sections
  - **옥천신문** (Okcheon News): Shows link preview when URL is provided, or "취재 요청하기" button that redirects to news submission form when empty
  - **참고링크** (Reference Links): Display clickable reference links with icons
  - **첨부파일** (Attachments): Display downloadable file attachments
  - **타 지역 정책 사례** (Regional Policy Case Studies): Display regional policy examples as text cards
- **Database Schema Updates**: 
  - Added `okinewsUrl` field (TEXT, nullable) to agendas table for Okcheon News links
  - Added `regionalCases` field (TEXT[], nullable) to agendas table for regional policy case studies
- **Admin Edit Enhancement**: Extended admin edit dialog to support managing all reference material types including Okcheon News URL and regional policy cases

## Previous Updates (2024-11-11)
- **Speech-to-Text Integration**: Implemented voice input for opinion submission using OpenAI Whisper API
  - Users can record audio directly in the browser using MediaRecorder API
  - Recorded audio is automatically transcribed to Korean text
  - Transcribed text appears in the text input field for review and editing
  - Supports pause/resume during recording
- **Admin Edit Functionality**: Added ability for administrators to edit agenda title, description, and status through a dialog interface
- **Dynamic Timeline**: Timeline component now dynamically updates based on agenda status, providing real-time progress tracking

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

**OpenAI**: Used for opinion clustering and speech-to-text:
- **Whisper API** (`whisper-1` model): Transcribes voice recordings to Korean text via `/api/opinions/transcribe` endpoint
- **Embeddings** (`text-embedding-3-small`): Generates semantic embeddings for opinion clustering
- **Chat Completions** (`gpt-4o-mini`): Generates cluster titles and summaries
- Cosine similarity matching for grouping opinions
- Automatic cluster generation via `/api/clusters/generate` endpoint