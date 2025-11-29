# CompBench - US Compensation Benchmark Database

## Overview

CompBench is a professional compensation benchmarking tool that aggregates salary data from multiple authoritative sources including the Bureau of Labor Statistics (BLS), O*NET, H1B filings, and commercial platforms. The application provides users with searchable compensation data, analytics dashboards, and a benchmarking calculator to help professionals understand market rates for various roles across industries, locations, and experience levels.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite for development and production builds.

**UI Component Library**: Shadcn UI (New York style) with Radix UI primitives, providing a comprehensive set of accessible, customizable components. The UI follows a design system with CSS variables for theming and uses Tailwind CSS for styling.

**Routing**: Wouter for client-side routing, providing a lightweight alternative to React Router.

**State Management**: TanStack Query (React Query) for server state management, caching, and synchronization. No global client state manager is used; component state is handled locally with React hooks.

**Form Handling**: React Hook Form with Zod for schema validation and type-safe forms.

**Data Visualization**: Recharts library for rendering charts and graphs on the dashboard and analytics pages.

**Key Pages**:
- Dashboard: Overview with aggregate statistics and visualizations
- Dataset Explorer: Searchable table of compensation records with filtering
- Benchmark Tool: Form-based calculator for personalized compensation estimates
- Methodology: Documentation of data sources and collection strategy

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**API Design**: RESTful API with endpoints for querying compensation records, analytics, and benchmark calculations. Routes are centralized in `server/routes.ts`.

**Build Strategy**: The application uses esbuild to bundle server code and Vite to build the client, with selected dependencies bundled to reduce cold start times (specified in the allowlist in `script/build.ts`).

**Development Mode**: Hot module replacement (HMR) via Vite middleware integrated into Express server during development.

**Static File Serving**: Production builds serve the compiled client application from the `dist/public` directory.

### Data Storage

**Database**: PostgreSQL accessed via Neon's serverless driver with WebSocket support for edge compatibility.

**ORM**: Drizzle ORM for type-safe database queries and schema management. Schema is defined in `shared/schema.ts` and migrations are stored in the `migrations` directory.

**Database Schema**: Single primary table `compensation_records` containing:
- Job information (title, SOC code, industry NAICS, company size/type)
- Location data (state, MSA, cost of living index, remote eligibility)
- Compensation metrics (salary ranges, total compensation, pay type)
- Requirements (experience, education, skills, management level)
- Metadata (data source, confidence score, sample size, timestamps)

**Data Seeding**: Realistic seed data generated from market research (in `server/seed.ts`) includes major tech hubs, various industries, and role levels with appropriate salary ranges adjusted for cost of living.

### Data Collection Strategy

The application is designed to aggregate data from four primary source categories:

1. **Government Sources** (BLS OEWS, H1B Database): High-reliability official wage statistics
2. **Commercial APIs** (Glassdoor, Levels.fyi, Payscale): Crowdsourced and verified compensation data
3. **Job Postings**: Salary ranges from Indeed/LinkedIn enabled by pay transparency laws
4. **O*NET Database**: Job descriptions and skill requirements linked to BLS data

Each record includes confidence scoring and sample size tracking to indicate data reliability.

### External Dependencies

**Database Provider**: Neon PostgreSQL (serverless) - connection configured via `DATABASE_URL` environment variable.

**UI Component System**: Radix UI primitives for accessible, unstyled components customized with Tailwind CSS.

**Icon Library**: Lucide React for consistent iconography throughout the application.

**Session Management**: Express-session with connect-pg-simple for PostgreSQL-backed sessions (configured but not actively used in current implementation).

**Development Tools**:
- Replit-specific Vite plugins for cartographer and dev banner
- Custom meta images plugin for OpenGraph/Twitter card image handling
- Runtime error overlay for development debugging

**Type Safety**: Zod for runtime validation and drizzle-zod for deriving Zod schemas from database schema definitions, ensuring type consistency across client, server, and database layers.

**Styling**: Tailwind CSS with PostCSS for processing, custom theme configuration using CSS variables for consistent theming, and class-variance-authority for component variant management.