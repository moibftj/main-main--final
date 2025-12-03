# 🚀 Start the Talk-To-My-Lawyer App

Quick guide to get the application running locally.

---

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ npm or pnpm installed
- ✅ Supabase account (for database)
- ✅ OpenAI API key (for AI features)
- ✅ Stripe account (for payments) - optional for dev

---

## Step 1: Install Dependencies

```bash
npm install
# or
pnpm install
```

---

## Step 2: Environment Variables

Create `.env.local` file:

```bash
cp .env.example .env.local
```

### Minimal Setup (Required)

```bash
# Supabase (Required for auth & database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# OpenAI (Required for letter generation)
OPENAI_API_KEY=sk-proj-...

# Admin Portal (Required for admin access)
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=SecurePassword123!
ADMIN_PORTAL_KEY=your-secret-portal-key
```

### Full Setup (For Production Features)

```bash
# Stripe (Optional - for payment features)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Cron (Optional - for monthly subscription resets)
CRON_SECRET=your-random-secret-key
```

---

## Step 3: Database Setup

### Option A: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run migrations in order:

```sql
-- Run each file in this order:
scripts/001_setup_schema.sql
scripts/002_setup_rls.sql
scripts/003_seed_data.sql
scripts/004_create_functions.sql
scripts/005_letter_allowance_system.sql
scripts/006_audit_trail.sql
scripts/007_add_missing_letter_statuses.sql
scripts/008_employee_coupon_auto_generation.sql
scripts/009_add_missing_subscription_fields.sql
scripts/010_add_missing_functions.sql
scripts/011_security_hardening.sql
```

### Option B: Supabase CLI

```bash
# Install Supabase CLI if not installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

---

## Step 4: Start Development Server

```bash
npm run dev
# or
pnpm dev
```

The app will start on: **http://localhost:3000**

---

## 🧪 Verify Setup

### 1. Check Homepage
- Navigate to `http://localhost:3000`
- Should see landing page

### 2. Test Auth
- Go to `http://localhost:3000/auth/signup`
- Try creating an account

### 3. Test Admin Portal
- Go to `http://localhost:3000/secure-admin-gateway/login`
- Use credentials from `.env.local`:
  - Email: Your `ADMIN_EMAIL`
  - Password: Your `ADMIN_PASSWORD`
  - Portal Key: Your `ADMIN_PORTAL_KEY`

### 4. Test AI Letter Generation (Requires OpenAI Key)
- Sign up as a subscriber
- Go to `/dashboard/letters/new`
- Fill out letter form
- Submit and check if AI generates content

---

## 🐛 Troubleshooting

### "Unauthorized" or Auth Issues

**Check**:
1. Supabase URL and keys are correct in `.env.local`
2. Database migrations ran successfully
3. Restart dev server after changing `.env.local`

**Fix**:
```bash
# Restart dev server
# Kill current process (Ctrl+C)
npm run dev
```

### "Missing OPENAI_API_KEY"

**Check**:
1. `.env.local` has `OPENAI_API_KEY=sk-...`
2. Key is valid (test at platform.openai.com)
3. Key has sufficient credits

**Fix**:
```bash
# Add to .env.local
OPENAI_API_KEY=sk-proj-your-actual-key-here

# Restart server
npm run dev
```

### Database Connection Errors

**Check**:
1. Supabase project is running
2. RLS policies are set up (run `002_setup_rls.sql`)
3. Database functions exist (run `004_create_functions.sql`)

**Fix**:
```bash
# Check Supabase status
supabase status

# Or visit Supabase dashboard to verify project is active
```

### Port 3000 Already in Use

**Fix**:
```bash
# Use different port
PORT=3001 npm run dev

# Or kill existing process
lsof -ti:3000 | xargs kill -9
npm run dev
```

---

## 📊 Key Features to Test

### Subscriber Features
- ✅ Sign up / Login
- ✅ Generate first letter (free trial)
- ✅ View letter status
- ✅ Download PDF (once approved)

### Employee Features
- ✅ View coupon codes
- ✅ Track commissions
- ✅ View referral stats

### Admin Features
- ✅ Review pending letters
- ✅ Approve/reject letters
- ✅ Improve letters with AI
- ✅ Manage users
- ✅ View analytics

---

## 🚀 Next Steps

1. ✅ App running locally
2. ⏳ Test key features
3. ⏳ Set up Stripe for payment testing (optional)
4. ⏳ Configure production deployment

---

## 📚 Additional Resources

- **Full Setup Guide**: See `CLAUDE.md`
- **Database Functions**: See `DATABASE_FUNCTIONS.md`
- **Deployment**: See `SUPABASE_DEPLOYMENT.md`
- **Security**: See `SECURITY_CHECKLIST.md`

---

## ⚡ Quick Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run lint             # Run linter

# Database (requires Supabase CLI)
supabase start           # Start local Supabase
supabase db push         # Push migrations
supabase functions deploy # Deploy edge functions
```

---

## ✅ Success Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created with required variables
- [ ] Database migrations completed
- [ ] Dev server running (`npm run dev`)
- [ ] Can access homepage (localhost:3000)
- [ ] Can sign up/login
- [ ] Can access admin portal
- [ ] AI letter generation works

**Once all checked, you're ready to develop!** 🎉
