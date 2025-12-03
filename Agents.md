# Agents.md - Verification & Testing Guide

> Instructions for automated agents to verify Talk-To-My-Lawyer functionality.
> For full architecture, see consolidated documentation in project root.

---

## Quick Context

**App**: AI-powered legal letter SaaS with mandatory attorney review.
**Stack**: Next.js 16 (App Router) | Supabase (Postgres + RLS) | OpenAI | Stripe | pnpm

```
User → Letter Form → AI Draft (GPT-4 Turbo) → Admin Review → PDF Download
```

---

## ⚠️ CRITICAL: Role Verification

### Three Roles (Verify RLS Enforces These)

| Role | Can Access | CANNOT Access |
|------|-----------|---------------|
| `subscriber` | Own letters, subscription, profile | Other users' data, admin portal |
| `employee` | Own coupons, commissions | **ANY letter content** |
| `admin` | Everything via `/secure-admin-gateway` | N/A |

### is_super_user Verification
```
⚠️ profiles.is_super_user = UNLIMITED LETTERS, NOT admin privilege
Verify: No code treats is_super_user as admin access flag
```

---

## Verification Checklist

### 1. Authentication Flows

- [ ] **Subscriber**: Sign up → redirects to `/dashboard`
- [ ] **Employee**: Has access to `/dashboard/coupons`, `/dashboard/commissions`
- [ ] **Admin**: Only accessible via `/secure-admin-gateway/login` (no public signup)
- [ ] **Cross-role**: Subscribers cannot access admin routes, employees cannot see letters

### 2. Letter Lifecycle

```
draft → generating → pending_review → under_review → approved/rejected → completed
```

- [ ] Letter form submission creates record with `draft` status
- [ ] AI generation updates to `generating` then `pending_review`
- [ ] Admin review updates to `under_review`
- [ ] Approval/rejection logged via `log_letter_audit()`
- [ ] Subscriber sees content ONLY after approval

### 3. Subscription & Credits

| Plan | Price | Credits |
|------|-------|---------|
| Free Trial | $0 | 1 (first letter) |
| Single | $299 | 1 |
| Monthly | $299/mo | 4 |
| Yearly | $599/yr | 8 |

- [ ] Free trial: `count === 0` check works
- [ ] Credits deducted via `deduct_letter_allowance(u_id)`
- [ ] `is_super_user` bypasses credit check (unlimited)

### 4. Employee System

- [ ] Coupon auto-generated on employee role assignment (format: `EMP-XXXXXX`)
- [ ] Coupon applies 20% discount
- [ ] Commission: 5% of subscription amount
- [ ] Employee dashboard shows usage stats

### 5. Admin Portal

- [ ] Access: `/secure-admin-gateway/login`
- [ ] Auth: Email + Password + Portal Key (env-based)
- [ ] Session: 30-minute timeout
- [ ] Review queue shows `pending_review` letters
- [ ] Can approve, reject, or improve with AI

---

## Environment Variables (Verify Existence Only)

```bash
# Required - verify these exist in process.env
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_PORTAL_KEY
CRON_SECRET
```

⚠️ **Never log or expose actual values**

---

## Database Tables (Verify RLS Enabled)

- `profiles` - User accounts with role
- `letters` - Legal documents with status workflow
- `subscriptions` - Plans and credits
- `employee_coupons` - Discount codes
- `commissions` - Employee earnings
- `letter_audit_trail` - All letter actions

---

## Key Database Functions

| Function | Verify |
|----------|--------|
| `check_letter_allowance(u_id)` | Returns correct allowance info |
| `deduct_letter_allowance(u_id)` | Properly decrements credits |
| `log_letter_audit(...)` | Creates audit entries |
| `validate_coupon(code)` | Validates employee coupons |

---

## Build Verification

```bash
pnpm install    # No dependency errors
pnpm build      # Must pass (no TypeScript/Next.js errors)
pnpm dev        # Runs at localhost:3000
pnpm lint       # ESLint passes
```

---

## End-to-End Test Flow

### Test 1: Subscriber Journey
1. Sign up as subscriber
2. Create letter (first is free)
3. Verify AI draft generated
4. Verify letter shows "Under Review" (content hidden)
5. As admin: approve letter
6. Verify subscriber can now see content and download PDF

### Test 2: Employee Commission
1. Create employee user
2. Verify coupon auto-generated
3. Subscriber uses coupon at checkout
4. Verify 20% discount applied
5. Verify employee gets 1 point + 5% commission

### Test 3: Role Isolation
1. As employee: attempt to access `/api/letters` → should fail
2. As subscriber: attempt to access `/secure-admin-gateway` → should fail
3. Verify RLS prevents cross-user data access

---

## Safe Auto-Fixes (Agents May Perform)

✅ Install missing dependencies
✅ Fix obvious import errors
✅ Add missing TypeScript types
✅ Update deprecated API calls (if migration is documented)

---

## Do NOT Auto-Fix

❌ Change role semantics
❌ Bypass RLS policies
❌ Modify database schema without migration script
❌ Create new routes or flows not in codebase
❌ Expose or log secrets



