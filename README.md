# Salary Negotiation Coach

💸 **Transform Uncertainty into Actionable Confidence**

The Salary Negotiation Coach is a targeted application designed to empower job seekers by providing data-backed salary assessment and AI-generated, tone-adjusted negotiation scripts. Our core mission is to eliminate the anxiety and guesswork involved in responding to a job offer, ensuring users receive compensation commensurate with their market value.

## Features

### Offer Scorecard
Compare your salary offer against 45,000+ real market data points. See where your offer falls in the market (percentile position) and get insights on whether you're being offered a competitive package.

### Leverage Quiz
An 8-question assessment that calculates your negotiation power score (0-100). Based on factors like competing offers, market demand for your skills, and your current situation, you'll receive tactical recommendations on how hard to push.

### Script Generator
Get customizable negotiation email templates with adjustable tone (Polite, Professional, or Assertive). Edit and personalize the scripts to match your style before sending.

## Tech Stack

- **Frontend**: React with TypeScript, Vite, Tailwind CSS, Shadcn UI
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth (OpenID Connect)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/salary-negotiation-coach.git
   cd salary-negotiation-coach
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```
   DATABASE_URL=your_postgresql_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. Run database migrations:
   ```bash
   npm run db:push
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Open http://localhost:5000 in your browser.

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions and API client
│   │   └── pages/          # Page components (Home, Scorecard, Quiz, Scripts)
├── server/                 # Backend Express application
│   ├── routes.ts           # API endpoints
│   ├── storage.ts          # Database queries
│   └── replitAuth.ts       # Authentication setup
├── shared/                 # Shared code between frontend and backend
│   ├── schema.ts           # Database schema and types
│   └── negotiation-logic.ts # Scoring algorithms and script generation
└── README.md
```

## Data Sources

The market salary data is compiled from government sources including:
- Bureau of Labor Statistics (BLS)
- H1B filings and disclosures

## License

MIT
