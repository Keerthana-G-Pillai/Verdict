# VERDICT — Deployment Guide

## Quick Start (Local Development)

```bash
npm install
cp .env.example .env.local
# Fill in your API keys in .env.local
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Yes (for AI) | Groq API key — free at console.groq.com |
| `GROQ_MODEL` | No | Default: `llama-3.1-8b-instant` |
| `OPENROUTER_API_KEY` | No | Auto-fallback when Groq fails — free at openrouter.ai |
| `OPENROUTER_MODEL` | No | Default: `meta-llama/llama-3.1-8b-instruct:free` |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes (for auth) | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes (for auth) | Supabase anon (public) key |

**Without Supabase keys**: App runs in guest-only mode. All analysis features work. Cloud sync and authentication are disabled.

**Without AI keys**: App uses the deterministic VERDICT engine. All features still work.

## Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the Supabase SQL Editor
3. Configure Auth → URL Configuration with your deployment URL
4. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to environment variables
5. *(Optional for demos)* Disable email confirmation: Authentication → Providers → Email → Confirm email → OFF

## Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or via CLI
vercel env add GROQ_API_KEY
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

Or use the Vercel dashboard → Settings → Environment Variables.

## AI Provider Chain

```
Request
  ↓
Groq (llama-3.1-8b-instant) — primary, fastest
  ↓ (if fails)
OpenRouter (llama-3.1-8b-instruct:free) — automatic fallback
  ↓ (if fails)
Deterministic VERDICT Engine — always works, no API required
```

The chain is automatic. Users always get a result.

## Security Notes

- `GROQ_API_KEY` and `OPENROUTER_API_KEY` are server-only — never exposed to client
- `NEXT_PUBLIC_*` variables are safe to expose (Supabase anon key is public by design)
- Row Level Security is enabled — users can only access their own data
- Never add `SUPABASE_SERVICE_ROLE_KEY` to client-side code

## Production Checklist

- [ ] `GROQ_API_KEY` configured
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured  
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] Supabase schema applied (`supabase/schema.sql`)
- [ ] Supabase Auth redirect URLs configured
- [ ] `npm run build` passes clean
- [ ] Production URL tested end-to-end
