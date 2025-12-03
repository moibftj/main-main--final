# Production Deployment Checklist
## Domain: www.talk-to-my-lawyer.com

### ✅ Completed Configuration

1. **Domain URLs Fixed**
   - Updated `.env.example` with correct domain (www.talk-to-my-lawyer.com)
   - Updated layout.tsx fallback URL
   - Updated admin email placeholders
   - Fixed all domain references from talk-to-my-lawyers.com → talk-to-my-lawyer.com

2. **API Routes Configuration**
   - API routes use dynamic origin detection from request headers
   - Fallback to NEXT_PUBLIC_APP_URL environment variable
   - Stripe checkout redirects use the correct domain automatically

3. **Security Headers Implemented**
   - XSS protection enabled
   - Frame options set to SAMEORIGIN
   - Content type protection
   - CSP configured for Stripe and Supabase
   - HSTS enabled for production

### 🚨 Must-Configure Before Production

1. **Environment Variables** (Required in Vercel/hosting platform)
   ```bash
   # Domain Configuration
   NEXT_PUBLIC_APP_URL=https://www.talk-to-my-lawyer.com

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

   # OpenAI
   OPENAI_API_KEY=sk-...

   # Stripe (Production)
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

   # Admin Access
   ADMIN_EMAIL=admin@talk-to-my-lawyer.com
   # Use a strong, unique password (at least 16 characters, mix of upper/lowercase, numbers, symbols). Recommended: generate with a password manager.
   # Generate a secure random key: openssl rand -base64 32
   ADMIN_PORTAL_KEY=PASTE_SECURE_RANDOM_KEY_HERE

   # Generate a strong secret: openssl rand -base64 32
   CRON_SECRET=your-strong-random-secret
   # Generate a secure random key: openssl rand -base64 32
   CRON_SECRET=PASTE_SECURE_RANDOM_KEY_HERE
   CRON_SECRET=random-secret-key-for-cron
   ```
   > **Security Tip:** Never use weak or default passwords in production. Use a password manager to generate and store strong admin credentials.

2. **Supabase Configuration**
   - **Authentication URL**: `https://www.talk-to-my-lawyer.com`
   - **Redirect URLs** (add in Supabase dashboard):
     - `https://www.talk-to-my-lawyer.com/auth/callback`
     - `https://www.talk-to-my-lawyer.com/dashboard`
     - `https://www.talk-to-my-lawyer.com/dashboard/subscription`

   - **CORS Settings** (add in Supabase dashboard):
     - `https://www.talk-to-my-lawyer.com`
     - `https://talk-to-my-lawyer.com` (without www)

3. **Stripe Configuration**
   - Update webhook endpoint: `https://www.talk-to-my-lawyer.com/api/stripe/webhook`
   - Configure product prices in Stripe dashboard
   - Test with Stripe test keys before going live

4. **Domain Settings**
   - DNS A record pointing to Vercel/hosting IP
   - SSL certificate (auto-managed by Vercel)
   - Ensure both www and non-www versions work if desired

### 🔧 Security Hardening

1. **Database Security**
   - All tables have RLS (Row Level Security) enabled
   - Admin env validation on startup
   - Rate limiting on API endpoints

2. **API Security**
   - Rate limiting:
     - Letter generation: 5 per 15 minutes
     - Checkout attempts: 10 per 15 minutes
     - Admin login: 5 per 15 minutes
     - Auth endpoints: Limited appropriately

3. **Content Security**
   - CSP headers configured
   - XSS protection enabled
   - Frame clickjacking protection

### 📊 Monitoring & Logging

1. **Error Monitoring** (Consider adding)
   - Sentry or similar for error tracking
   - Vercel Analytics for performance

2. **Audit Logging** (Built-in)
   - Admin actions logged
   - Letter status changes tracked
   - Login attempts monitored

### ⚡ Performance Optimization

1. **Vercel Optimizations**
   - Edge functions for API routes
   - Automatic image optimization
   - Static generation where possible

2. **Database Optimization**
   - Supabase connection pooling
   - Database functions for complex operations
   - Indexes on frequently queried columns

### 🔄 Post-Deployment Tasks

1. **Create Admin User**
   ```bash
   node scripts/create-admin-user.ts
   ```

2. **Test Critical Paths**
   - User registration/login
   - Letter generation (free trial)
   - Subscription checkout
   - Admin login and review

3. **Monitor Initial Activity**
   - Check logs for errors
   - Verify Stripe webhooks are firing
   - Ensure emails are sending

### 📝 Notes

- The application is configured to run in test mode by default
   - Set `ENABLE_TEST_MODE=false` and `NEXT_PUBLIC_TEST_MODE=false` for production
   - This enables real Stripe payments

- Cron job for monthly subscription reset:
   - Set up in Vercel or external cron service
   - Endpoint: `https://www.talk-to-my-lawyer.com/api/subscriptions/reset-monthly`
   - Must include header: `Authorization: Bearer $CRON_SECRET`

### 🚨 Important

- Never commit `.env.local` to version control
- Use strong, unique passwords for production
- Regularly rotate API keys and secrets
- Keep all dependencies updated
- Monitor for security advisories