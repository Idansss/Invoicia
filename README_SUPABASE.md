# Invoicia + Supabase - Quick Start

## 🎯 What You Have Now

Your Invoicia app is now integrated with Supabase for:
- ✅ **Authentication** - Email/password + Google OAuth
- ✅ **Database** - PostgreSQL with Row Level Security
- ✅ **Storage** - File uploads (logos, attachments, PDFs)
- ✅ **Security** - Multi-tenant architecture with RLS policies

## 🚀 5-Minute Setup

### Step 1: Create Supabase Project (2 min)

1. Go to https://supabase.com and sign up
2. Click "New Project"
3. Fill in:
   - Name: `invoicia`
   - Database Password: (choose a strong password)
   - Region: (closest to you)
4. Click "Create" and wait ~2 minutes

### Step 2: Get API Keys (1 min)

1. In Supabase dashboard, go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon key**: `eyJ...` (long string)

### Step 3: Configure App (1 min)

```bash
cd invoicia-saa-s-ui

# Create environment file
cp .env.local.example .env.local

# Edit and paste your keys
nano .env.local
```

Paste:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Run Database Migration (1 min)

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy/paste contents of `invoicia-saa-s-ui/supabase/schema.sql`
4. Click **Run** (or Ctrl+Enter)
5. Repeat for `invoicia-saa-s-ui/supabase/storage.sql`

### Step 5: Test It! (30 sec)

```bash
pnpm dev
```

Open http://localhost:3000/signup and create an account!

## ✅ Verify It Works

After signing up:

1. **Check Database**: Go to Supabase → Table Editor
   - You should see your profile in `profiles` table
   - An organization in `organizations` table

2. **Check Auth**: Go to Supabase → Authentication
   - You should see your user

3. **Test Login**: Sign out and sign in again
   - Should redirect to `/app`

## 📚 Documentation

- **[SUPABASE_SETUP.md](./SUPABASE_SETUP.md)** - Detailed setup guide
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - How to use Supabase in your components
- **[SUPABASE_INTEGRATION_SUMMARY.md](./SUPABASE_INTEGRATION_SUMMARY.md)** - Complete overview

## 🎓 Next Steps

### Option A: Use Mock Data (Current State)
Your app currently uses mock data. Everything works, but data isn't persisted.

### Option B: Migrate to Real Data
Follow `MIGRATION_GUIDE.md` to replace mock data with Supabase queries.

Start with simple pages:
1. Customers page
2. Products page
3. Invoices page
4. Settings page

## 🔧 Common Commands

```bash
# Start dev server
pnpm dev

# Check Supabase connection
# (In browser console on any page)
const { data } = await supabase.from('profiles').select('*')
console.log(data)
```

## 🆘 Troubleshooting

### "Invalid API key"
→ Check `.env.local` has correct keys, restart dev server

### "relation does not exist"
→ Run `schema.sql` in Supabase SQL Editor

### Can't sign in
→ Check email for verification link (if email confirmation enabled)

### Need help?
→ Check `SUPABASE_SETUP.md` for detailed troubleshooting

## 📖 Quick Reference

### Use Supabase in Components

```tsx
// Client Component
"use client"
import { createClient } from "@/lib/supabase/client"

export default function MyComponent() {
  const supabase = createClient()
  
  async function loadData() {
    const { data } = await supabase.from("customers").select("*")
    return data
  }
}
```

### Use Helper Functions

```tsx
import { getCustomers, createCustomer } from "@/lib/supabase/queries"

// Get all customers
const customers = await getCustomers()

// Create customer
await createCustomer({
  name: "Acme Corp",
  email: "billing@acme.com"
})
```

## 🎉 You're Ready!

Your Invoicia app now has a production-ready backend. Start building! 🚀

---

**Questions?** Check the detailed guides or open an issue.
