# Examina AI Exam Platform

This is a full-stack Examina AI Exam Platform built with React, Vite, Express, and Supabase.

## Vercel Deployment

This project is configured for easy deployment to Vercel.

### 1. Prerequisites

- A [Vercel](https://vercel.com) account.
- A [Supabase](https://supabase.com) project.

### 2. Environment Variables

Set the following environment variables in your Vercel project settings:

- `SUPABASE_URL`: Your Supabase project URL.
- `SUPABASE_ANON_KEY`: Your Supabase anonymous API key.
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role API key (required for backend operations).
- `JWT_SECRET`: A secret key for JWT authentication (e.g., `examina-secret-key-2026`).
- `GEMINI_API_KEY`: Your Google Gemini API key.

### 3. Deployment Steps

1. Connect your GitHub/GitLab/Bitbucket repository to Vercel.
2. Vercel will automatically detect the Vite configuration and the `vercel.json` routing.
3. The build command should be `npm run build`.
4. The output directory should be `dist`.

### 4. Database Setup

Ensure you have run the SQL script in `supabase_schema.sql` in your Supabase SQL Editor to set up the required tables and policies.

## Local Development

1. Install dependencies: `npm install`
2. Create a `.env` file based on `.env.example`.
3. Start the dev server: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
