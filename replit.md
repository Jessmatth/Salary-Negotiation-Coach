# Salary Negotiation Coach

## Overview

SalaryCoach is a salary negotiation coaching tool that helps professionals evaluate job offers and negotiate confidently. The app provides three core features:

1. **Offer Scorecard** - Compares user salary offers against 45,000+ real market data points, showing percentile position and market comparison
2. **Leverage Quiz** - An 8-question assessment that calculates a 0-100 negotiation power score with tactical recommendations
3. **Script Generator** - Creates customizable negotiation emails with tone adjustment (Polite/Professional/Assertive)

The underlying data comes from government sources including Bureau of Labor Statistics (BLS) and H1B filings.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, built using Vite for development and production builds.

**UI Component Library**: Shadcn UI (New York style) with Radix UI primitives. Dark theme with slate/emerald color palette designed for a professional, trustworthy aesthetic.

**Routing**: Wouter for client-side routing with the following pages:
- `/` - Home: Landing page with "Is This a Good Offer?" CTA
- `/scorecard` - Offer Scorecard: Form intake and results with gauge visualization
- `/quiz` - Leverage Quiz: Single-question-per-screen flow with progress bar
- `/scripts` - Script Generator: Tone slider with editable email template

**State Management**: TanStack Query for server state. Local component state with React hooks.

**Form Handling**: React Hook Form with Zod for schema validation (using `z.coerce.number()` for numeric inputs).

### Backend Architecture

**Server Framework**: Express.js running on Node.js with TypeScript.

**API Endpoints**:
- `POST /api/scorecard` - Accepts offer details, returns market comparison with percentile position
- `POST /api/leverage-score` - Scores 8 quiz questions using weighted rubric, returns 0-100 score
- `POST /api/scripts` - Generates tone-adjusted negotiation email templates
- `GET /api/job-titles` - Autocomplete suggestions for job titles
- Legacy analytics endpoints for backward compatibility

**Negotiation Logic** (`shared/negotiation-logic.ts`):
- Leverage scoring algorithm with weighted rubric for 8 factors
- Market position calculation using percentile bands
- Script generation with tone variants (polite, professional, aggressive)
- Narrative generation based on market position

### Data Storage

**Database**: PostgreSQL via Neon's serverless driver.

**ORM**: Drizzle ORM with schema in `shared/schema.ts`.

**Database Tables**:
1. `compensation_records` - 45,000+ salary records with:
   - Job title, SOC code, industry, company size/type
   - Location (state, MSA, cost of living index)
   - Salary ranges (min, median, max, total comp)
   - Experience, education, skills, management level
   - Data source, confidence score, sample size

2. `offer_evaluations` - Stores user scorecard sessions with offer details and results

3. `quiz_responses` - Stores leverage quiz answers and calculated scores

### Key Files

- `shared/schema.ts` - Database schema and Zod validation schemas
- `shared/negotiation-logic.ts` - Leverage scoring and script generation logic
- `server/storage.ts` - Database queries including market range percentile calculations
- `server/routes.ts` - API endpoint handlers
- `client/src/pages/home.tsx` - Landing page
- `client/src/pages/scorecard.tsx` - Offer evaluation form and results
- `client/src/pages/quiz.tsx` - 8-question leverage assessment
- `client/src/pages/scripts.tsx` - Email script generator with tone slider

### External Dependencies

**Database Provider**: Neon PostgreSQL (serverless) - connection via `DATABASE_URL`.

**UI Components**: Radix UI primitives + Tailwind CSS styling.

**Icon Library**: Lucide React.

**Type Safety**: Zod for runtime validation with `z.coerce.number()` for form inputs.
