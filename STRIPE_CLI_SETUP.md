# Stripe CLI Setup Guide for Talk-To-My-Lawyer

## Installation ✅
Stripe CLI v1.21.0 is already installed on your system.

## Configuration

### 1. Login to Stripe
```bash
stripe login
```
This will open your browser to authenticate with your Stripe account.

### 2. Set Up Webhook Forwarding for Local Development

#### Option A: Forward Webhooks to Local Server
```bash
# Forward webhook events to your local development server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Forward to a specific port if not using 3000
stripe listen --forward-to localhost:3000/api/stripe/webhook --port 3000
```

#### Option B: Use Specific Webhook Events
```bash
# Listen for specific events (recommended for faster testing)
stripe listen --forward-to localhost:3000/api/stripe/webhook \
  --events checkout.session.completed, \
  --events customer.subscription.updated, \
  --events customer.subscription.deleted, \
  --events invoice.payment_succeeded, \
  --events invoice.payment_failed
```

### 3. Test Webhook Events
```bash
# Trigger a test checkout session completed event
stripe trigger checkout.session.completed

# Trigger a test subscription event
stripe trigger customer.subscription.updated

# Trigger a payment failure event
stripe trigger invoice.payment_failed
```

## Environment Variables for Local Development

Make sure your `.env.local` has these Stripe variables:

```bash
# Stripe Test Mode Keys (get from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here

# Test mode enabled
ENABLE_TEST_MODE=true
NEXT_PUBLIC_TEST_MODE=true
```

## Common Stripe CLI Commands

### Payment Testing
```bash
# Create a test customer
stripe customers create --email test@example.com --name "Test User"

# Create a test price
stripe prices create --currency usd --unit-amount 29900 --product "prod_test_product"

# Create a test checkout session
stripe checkout sessions create \
  --success-url "http://localhost:3000/success?session_id={CHECKOUT_SESSION_ID}" \
  --cancel-url "http://localhost:3000/cancel" \
  --payment-mode-types card \
  --line-items "price=price_test_price,quantity=1"
```

### Product Management
```bash
# List all products
stripe products list

# Get a specific product
stripe products get prod_test_product

# Create a product (these are already created in your app)
stripe products create --name "Single Letter" --default-price 29900 --currency usd
stripe products create --name "Monthly Plan" --default-price 29900 --currency usd --recurring-interval month
stripe products create --name "Yearly Plan" --default-price 59900 --currency usd --recurring-interval year
```

### Webhook Management
```bash
# List webhook endpoints
stripe webhook_endpoints list

# Create a webhook endpoint
stripe webhook_endpoints create \
  --url "https://your-domain.com/api/stripe/webhook" \
  --enabled-events "checkout.session.completed,customer.subscription.updated"

# Test webhook delivery
stripe webhook_endends trigger webhook_endpoint_id checkout.session.completed
```

## Debugging Tips

1. **Check Stripe Logs**:
   ```bash
   stripe logs tail
   ```

2. **Monitor Specific Resources**:
   ```bash
   # Watch for new charges
   stripe charges list --watch

   # Watch for new checkout sessions
   stripe checkout sessions list --watch
   ```

3. **Test Different Scenarios**:
   ```bash
   # Test successful payment
   stripe trigger payment_intent.succeeded

   # Test failed payment
   stripe trigger payment_intent.payment_failed

   # Test subscription cancellation
   stripe trigger customer.subscription.deleted
   ```

## Production vs Test Mode

The CLI automatically uses your test environment. To switch to production:
1. Log in with production keys (not recommended for testing)
2. Use separate environment variables
3. Always keep test and production data separate

## Integration with Your App

Your app already has these endpoints ready:
- `/api/create-checkout` - Creates Stripe checkout sessions
- `/api/stripe/webhook` - Handles webhook events
- `/api/stripe/webhook` - Processes subscription updates, payment failures

The webhook endpoint expects these events:
- `checkout.session.completed` - For one-time purchases
- `customer.subscription.updated` - For subscription changes
- `invoice.payment_succeeded` - For successful payments
- `invoice.payment_failed` - For failed payments

## Quick Test Workflow

1. Start your local dev server:
   ```bash
   npm run dev
   ```

2. Start Stripe webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. Test checkout flow:
   - Visit http://localhost:3000
   - Try purchasing a plan
   - Watch webhook events in the CLI

4. Verify in Stripe Dashboard:
   - Check customers were created
   - Check subscriptions were created
   - Check payments were processed