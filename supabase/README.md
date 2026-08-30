# VERDICT — Supabase Setup

## 1. Create a Project

1. Go to [supabase.com](https://supabase.com) and create a free project.
2. Wait for your project to be ready (~2 min).

## 2. Run the Schema

1. In your Supabase dashboard, navigate to **SQL Editor**.
2. Paste the contents of `supabase/schema.sql` and click **Run**.
3. All tables, indexes, and RLS policies are created.

## 3. Configure Authentication

1. In Supabase dashboard, go to **Authentication → URL Configuration**.
2. Add your site URL to **Site URL**: `https://your-verdict-domain.vercel.app`
3. Add the callback URL to **Redirect URLs**: `https://your-verdict-domain.vercel.app/auth/callback`
4. For local development, also add: `http://localhost:3000/auth/callback`

## 4. Get Your API Keys

1. Go to **Settings → API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Add to your `.env.local`.
4. **Never** add the service role key to the frontend.

## 5. Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

## 6. Security Notes

- Row Level Security is enabled on all tables.
- Users can only access their own records.
- The anon key is safe to expose client-side — RLS is the real security boundary.
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client code.

## 7. Email Confirmation

By default Supabase requires email confirmation.
For hackathon demos, disable this in:
**Authentication → Providers → Email → Confirm email** (toggle off).

This allows instant sign-in after sign-up without email verification.
