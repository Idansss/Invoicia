# Supabase Integration Setup Guide

This guide will help you set up Supabase for authentication, database, and storage in your Invoicia application.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js and pnpm installed
- Your Invoicia project cloned locally

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in the details:
   - **Name**: `invoicia` (or your preferred name)
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the region closest to your users
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase project dashboard, go to **Settings** > **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`) - Keep this secret!

## Step 3: Configure Environment Variables

1. In your project root (`invoicia-saa-s-ui/`), create a `.env.local` file:

```bash
# Copy the example file
cp .env.local.example .env.local
```

2. Edit `.env.local` and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## Step 4: Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy and paste the contents of `invoicia-saa-s-ui/supabase/schema.sql`
5. Click **Run** (or press Ctrl/Cmd + Enter)
6. Wait for the migration to complete (you should see "Success" message)

## Step 5: Setup Storage Buckets

1. Still in the **SQL Editor**, create a new query
2. Copy and paste the contents of `invoicia-saa-s-ui/supabase/storage.sql`
3. Click **Run**

Alternatively, you can create buckets manually:

1. Go to **Storage** in the left sidebar
2. Click **New bucket**
3. Create three buckets:
   - Name: `logos`, Public: No
   - Name: `attachments`, Public: No
   - Name: `invoice-pdfs`, Public: No

## Step 6: Configure Authentication Providers

### Email/Password Authentication (Already Enabled)

Email/password auth is enabled by default. No additional configuration needed.

### Google OAuth (Optional)

1. Go to **Authentication** > **Providers** in your Supabase dashboard
2. Find **Google** and click to expand
3. Toggle **Enable Google provider** to ON
4. You'll need to create a Google OAuth app:
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **Credentials** > **Create Credentials** > **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: Add `https://your-project.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret**
5. Paste the Client ID and Client Secret in Supabase
6. Click **Save**

## Step 7: Test the Installation

1. Start your development server:

```bash
cd invoicia-saa-s-ui
pnpm dev
```

2. Open http://localhost:3000
3. Click "Sign up" and create a test account
4. Check your email for verification link (if email confirmation is enabled)
5. Try signing in with your new account
6. You should be redirected to `/app`

## Step 8: Verify Database Setup

1. Go to **Table Editor** in Supabase dashboard
2. You should see all these tables:
   - organizations
   - profiles
   - customers
   - products
   - invoices
   - invoice_line_items
   - payments
   - audit_events
   - reminder_rules
   - reminder_logs
   - attachments
   - organization_settings

3. After signing up, check the `profiles` and `organizations` tables:
   - You should see your new user profile
   - An organization should be automatically created

## Step 9: Test Storage

1. Log into your app
2. Go to **Settings** > **Templates**
3. Try uploading a logo
4. Go to **Storage** in Supabase dashboard
5. Navigate to the `logos` bucket
6. You should see your uploaded file under `{organization_id}/`

## Architecture Overview

### Database Schema

The database is organized around **multi-tenancy** using organizations:

- Each user belongs to an **organization**
- All data (invoices, customers, products) is scoped to an organization
- Row Level Security (RLS) ensures users can only access their organization's data

### Row Level Security (RLS)

All tables have RLS policies that:
- Automatically filter data by organization
- Prevent users from accessing other organizations' data
- Work transparently - you don't need to add `WHERE organization_id = ...` to queries

### Storage Structure

Files are organized by organization:
```
logos/
  {organization_id}/
    logo.png

attachments/
  {organization_id}/
    {invoice_id}/
      file1.pdf
      file2.png

invoice-pdfs/
  {organization_id}/
    {invoice_id}.pdf
```

### Authentication Flow

1. User signs up → Supabase creates auth.users record
2. Database trigger fires → Creates organization and profile
3. User signs in → Supabase sets session cookie
4. Middleware checks session → Protects /app routes
5. All queries automatically scoped to user's organization via RLS

## Common Issues and Solutions

### Issue: "Invalid API key" error

**Solution**: Double-check your `.env.local` file has the correct keys from Supabase dashboard.

### Issue: "relation does not exist" error

**Solution**: Run the schema.sql migration in Supabase SQL Editor.

### Issue: Can't upload files

**Solution**: 
1. Check storage buckets exist
2. Run storage.sql to set up policies
3. Verify RLS policies are enabled

### Issue: User can't sign in after signup

**Solution**: Check if email confirmation is required:
1. Go to **Authentication** > **Settings** in Supabase
2. Under **Email Auth**, check "Enable email confirmations"
3. If enabled, users must click the link in their email before signing in

### Issue: Middleware redirect loop

**Solution**: Clear your browser cookies and try again. Make sure `.env.local` is properly configured.

## Next Steps

Now that Supabase is set up, you can:

1. **Replace Mock Data**: Update components to fetch real data from Supabase
2. **Add Real-time Features**: Use Supabase real-time subscriptions for live updates
3. **Implement File Uploads**: Use Supabase Storage for logos and attachments
4. **Add Email Notifications**: Use Supabase Edge Functions for sending emails
5. **Deploy to Production**: Update environment variables in your hosting platform

## Development vs Production

### Development
- Use `.env.local` for local development
- Test with development Supabase project

### Production
- Create a separate Supabase project for production
- Set environment variables in your hosting platform (Vercel, Netlify, etc.)
- Enable email confirmations
- Set up custom SMTP for email delivery
- Configure OAuth redirect URLs for production domain

## Security Checklist

- ✅ RLS policies enabled on all tables
- ✅ Storage policies restrict access by organization
- ✅ Service role key kept secret (never exposed to client)
- ✅ Anon key used for client-side operations only
- ✅ Middleware protects authenticated routes
- ✅ Email verification enabled (recommended for production)

## Support

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Next.js + Supabase Guide**: https://supabase.com/docs/guides/getting-started/quickstarts/nextjs

## Files Reference

- `lib/supabase/client.ts` - Browser client for client components
- `lib/supabase/server.ts` - Server client for server components/actions
- `lib/supabase/middleware.ts` - Session management
- `middleware.ts` - Route protection
- `supabase/schema.sql` - Database schema and RLS policies
- `supabase/storage.sql` - Storage buckets and policies
- `app/auth/callback/route.ts` - OAuth callback handler

## Migration from Mock Data

To replace the mock data with real Supabase queries, see the separate guide: `MIGRATION_GUIDE.md`
