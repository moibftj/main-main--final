# Talk-To-My-Lawyer

**AI-Powered Legal Letter Generation Platform with Professional Attorney Review**

A production-ready SaaS platform that generates professional legal letters with AI assistance and mandatory human oversight. The platform enables users to create legally sound letters through an AI-powered workflow with professional attorney review.

---

## 🎯 Overview

Talk-To-My-Lawyer is a three-tier platform designed for:
- **Subscribers**: Generate professional legal letters with AI assistance
- **Employees**: Earn commissions through referral coupons
- **Admins**: Review, edit, and approve all letters before delivery

### Core Workflow

```
Subscriber → AI Draft Generation → Admin Review & Editing → Approval → Subscriber Dashboard
```

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 15 with App Router (React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4.1+ with custom design system
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Animations**: Motion (Framer Motion)

### Backend
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth with role-based access control
- **API**: Next.js API Routes (App Router)
- **AI Integration**: OpenAI GPT-4 Turbo via Vercel AI SDK
- **PDF Generation**: jsPDF
- **Payments**: Stripe (checkout + webhooks)

### Infrastructure
- **Hosting**: Vercel
- **Database**: Supabase (PostgreSQL with RLS)
- **Package Manager**: pnpm
- **Node.js**: 18+

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18 or higher
- pnpm (recommended) or npm
- Supabase account
- OpenAI API key
- Stripe account (optional for development)

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd main-main--final

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run database migrations
# Use Supabase dashboard SQL editor to run scripts in order:
# scripts/001_setup_schema.sql
# scripts/002_setup_rls.sql
# ... (see CLAUDE.md for complete migration order)

# 5. Start development server
pnpm dev
```

Visit `http://localhost:3000` to see the application.

---

## 💼 Business Model

### Pricing Plans

- **Free Trial**: First letter free for new subscribers
- **Single Letter**: $299 one-time purchase
- **Monthly Plan**: $299/month (4 letters included)
- **Yearly Plan**: $599/year (8 letters included)

### Employee Program

- **Discount**: 20% off for subscribers using employee coupons
- **Commission**: Employees earn 5% commission on successful subscriptions

---

## 🔐 User Roles & Access

### Subscriber
- Generate legal letters (AI-powered)
- View letter status and history
- Download approved letters as PDF
- Manage subscription and billing
- **Access**: `/dashboard/letters`, `/dashboard/subscription`

### Employee
- View personal referral coupon codes
- Track commission earnings (5% of subscription amount)
- Monitor coupon usage statistics
- **CANNOT** access letter content (security requirement)
- **Access**: `/dashboard/coupons`, `/dashboard/commissions`

### Admin
- Review all pending letters
- Edit letters manually or improve with AI assistance
- Approve or reject letters
- View analytics and user management
- **Access**: `/secure-admin-gateway/*`

---

## 📝 Letter Workflow

### 1. Generation (Subscriber)
```
Subscriber creates letter → AI generates draft → Status: "pending_review"
```

### 2. Review (Admin)
```
Admin opens letter → Reviews/edits content → Can use AI to improve → Approves or Rejects
```

### 3. Delivery (Subscriber)
```
Letter approved → Visible in subscriber dashboard → Can download PDF or send via email
```

### Letter Statuses
- `draft` - Initial state, not submitted
- `generating` - AI is creating the letter
- `pending_review` - Waiting for admin review
- `under_review` - Admin is reviewing
- `approved` - Admin approved, ready for user
- `completed` - Final delivered state
- `rejected` - Admin rejected, needs revision
- `failed` - Error occurred during generation

---

## 🗄️ Database Schema

### Core Tables

- **profiles** - User accounts with role-based access (subscriber/employee/admin)
- **letters** - Legal letters with AI drafts and admin-approved content
- **subscriptions** - User subscription plans and letter allowances
- **employee_coupons** - Employee referral discount codes (20% off)
- **commissions** - Employee commission tracking (5% rate)
- **letter_audit_trail** - Complete audit log of all letter actions

### Row Level Security (RLS)

All tables have RLS policies enforced:
- Subscribers can only access their own data
- Employees cannot access letter content (business requirement)
- Admins have full access to all data

---

## 🛡️ Security Features

- ✅ Row Level Security on all database tables
- ✅ Role-based access control
- ✅ Admin portal with separate authentication
- ✅ Complete audit trail for all letter changes
- ✅ Server-side AI API key protection
- ✅ Input validation and sanitization
- ✅ Secure session management
- ✅ Employee isolation from letter content

---

## 📚 Documentation

### Essential Reading

1. **[CLAUDE.md](./CLAUDE.md)** - Comprehensive AI assistant guide and development workflows
2. **[PLATFORM_ARCHITECTURE.md](./PLATFORM_ARCHITECTURE.md)** - Detailed system architecture and workflows
3. **[DATABASE_FUNCTIONS.md](./DATABASE_FUNCTIONS.md)** - Database function reference
4. **[START_APP.md](./START_APP.md)** - Quick start guide for development

### Additional Guides

- **[SETUP.md](./SETUP.md)** - Initial setup instructions
- **[SUPABASE_DEPLOYMENT.md](./SUPABASE_DEPLOYMENT.md)** - Supabase deployment guide
- **[SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md)** - Security guidelines
- **[MANUAL_QA_SCRIPT.md](./MANUAL_QA_SCRIPT.md)** - Quality assurance testing
- **[PRODUCTION_CHECKLIST.md](./PRODUCTION_CHECKLIST.md)** - Production deployment checklist
- **[FREE_TRIAL_IMPLEMENTATION.md](./FREE_TRIAL_IMPLEMENTATION.md)** - Free trial system details

---

## 🧪 Development

### Available Commands

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Run ESLint

# Database
supabase start        # Start local Supabase
supabase db push      # Push migrations
supabase db reset     # Reset database
```

### Environment Variables

See `.env.example` for all required environment variables.

**Required for development:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_PORTAL_KEY`

**Optional:**
- Stripe keys (for payment testing)
- Redis/Upstash (for rate limiting)

---

## 🚀 Deployment

### Vercel (Recommended)

1. Connect repository to Vercel
2. Add all environment variables
3. Deploy

### Environment Setup

```bash
# Production environment variables
NEXT_PUBLIC_APP_URL=https://www.talk-to-my-lawyer.com
NEXT_PUBLIC_SUPABASE_URL=<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-key>
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
# ... see PRODUCTION_CHECKLIST.md for complete list
```

---

## 🧩 Key Features

### For Subscribers
- ✅ Free first letter (no credit card required)
- ✅ AI-powered letter generation (OpenAI GPT-4 Turbo)
- ✅ Professional attorney review and editing
- ✅ PDF generation and email delivery
- ✅ Subscription management with letter allowances
- ✅ Complete letter history and status tracking

### For Employees
- ✅ Automatic coupon code generation
- ✅ 20% discount for referred subscribers
- ✅ 5% commission on successful subscriptions
- ✅ Real-time commission tracking dashboard
- ✅ Usage statistics and analytics

### For Admins
- ✅ Dedicated admin portal (`/secure-admin-gateway`)
- ✅ Review queue with FIFO ordering
- ✅ AI-powered letter improvement tool
- ✅ Manual editing with rich text editor
- ✅ Approve/reject workflow with notes
- ✅ Complete audit trail visibility
- ✅ User and subscription management

---

## 🔒 Data Privacy & Compliance

- All user data protected with RLS policies
- Employees cannot access subscriber letter content
- Complete audit trail for all letter modifications
- Secure admin authentication with dual-factor verification
- GDPR-compliant data handling

---

## 🛠️ Project Structure

```
/
├── app/                     # Next.js App Router
│   ├── api/                 # API routes
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # User dashboards
│   ├── secure-admin-gateway/# Admin portal
│   └── ...
├── components/              # React components
│   ├── admin/               # Admin-specific
│   └── ui/                  # shadcn/ui components
├── lib/                     # Utilities and helpers
│   ├── auth/                # Authentication utilities
│   └── supabase/            # Supabase configuration
├── scripts/                 # Database migration scripts
├── public/                  # Static assets
└── ...
```

---

## 🤝 Contributing

This is a production application. For development:

1. Read [CLAUDE.md](./CLAUDE.md) for development guidelines
2. Follow TypeScript strict mode requirements
3. Ensure all tests pass before committing
4. Follow security best practices
5. Update documentation for any changes

---

## 📞 Support

For questions or issues:
- Check documentation in `CLAUDE.md` and `PLATFORM_ARCHITECTURE.md`
- Review the appropriate specialized guide
- Consult database function reference in `DATABASE_FUNCTIONS.md`

---

## 📄 License

See [LICENSE](./LICENSE) file for details.

---

## ✅ Production Status

**Current Status**: Production-ready MVP

**Completed**:
- ✅ Three-tier user system (subscriber/employee/admin)
- ✅ AI letter generation (OpenAI GPT-4 Turbo)
- ✅ Admin review and approval workflow
- ✅ Free trial system
- ✅ Subscription and payment integration
- ✅ Employee coupon and commission system
- ✅ Complete audit trail
- ✅ Row Level Security
- ✅ PDF generation
- ✅ Email delivery

**Next Phase**:
- Advanced analytics dashboard
- Real-time notifications
- Letter templates library
- Multi-language support

---

**Last Updated**: December 2025
**Version**: 1.0.0
**Production Domain**: www.talk-to-my-lawyer.com
