import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

// Use service role client for webhooks (no user session context)
function getSupabaseServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase service configuration')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

export async function POST(request: NextRequest) {
  if (!stripe || !webhookSecret) {
    console.error('[StripeWebhook] Stripe not configured')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  if (!sig) {
    console.error('[StripeWebhook] No signature')
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    console.log('[StripeWebhook] Event received:', event.type)

    const supabase = getSupabaseServiceClient()

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        // Verify session is paid
        if (session.payment_status !== 'paid') {
          console.log('[StripeWebhook] Payment not completed, skipping')
          return NextResponse.json({ received: true })
        }

        const metadata = session.metadata
        if (!metadata) {
          console.error('[StripeWebhook] No metadata in session')
          return NextResponse.json({ error: 'No metadata' }, { status: 400 })
        }

        // Update subscription status to active
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            stripe_session_id: session.id,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', metadata.user_id)
          .eq('status', 'pending')

        if (updateError) {
          console.error('[StripeWebhook] Failed to update subscription:', updateError)
        }

        // Create commission if employee referral
        if (metadata.employee_id && metadata.final_price !== '0') {
          const commissionAmount = parseFloat(metadata.final_price) * 0.05

          const { error: commissionError } = await supabase
            .from('commissions')
            .insert({
              employee_id: metadata.employee_id,
              subscription_id: metadata.subscription_id || session.id,
              subscription_amount: parseFloat(metadata.final_price),
              commission_rate: 0.05,
              commission_amount: commissionAmount,
              status: 'pending'
            })

          if (commissionError) {
            console.error('[StripeWebhook] Failed to create commission:', commissionError)
          }
        }

        console.log('[StripeWebhook] Payment completed for user:', metadata.user_id)
        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const metadata = session.metadata

        if (metadata) {
          // Update subscription status to canceled
          await supabase
            .from('subscriptions')
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', metadata.user_id)
            .eq('status', 'pending')

          console.log('[StripeWebhook] Checkout expired for user:', metadata.user_id)
        }
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('[StripeWebhook] Payment succeeded:', paymentIntent.id)
        // Additional payment success handling if needed
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        console.log('[StripeWebhook] Payment failed:', paymentIntent.id)

        // Update any pending subscription to failed
        if (paymentIntent.metadata?.user_id) {
          await supabase
            .from('subscriptions')
            .update({
              status: 'payment_failed',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', paymentIntent.metadata.user_id)
            .eq('status', 'pending')
        }
        break
      }

      default: {
        console.log(`[StripeWebhook] Unhandled event type: ${event.type}`)
      }
    }

    return NextResponse.json({ received: true })

  } catch (err: any) {
    console.error('[StripeWebhook] Error:', err.message)

    if (err.type === 'StripeSignatureVerificationError') {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}