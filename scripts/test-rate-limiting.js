// Test script for rate limiting
// Usage: node scripts/test-rate-limiting.js

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

async function testRateLimit(endpoint, payload, limit = 5) {
  console.log(`\n🧪 Testing rate limit for: ${endpoint}`)
  console.log(`📊 Expected limit: ${limit} requests`)

  let successCount = 0
  let rateLimitHit = false
  let lastResponse = null

  for (let i = 1; i <= limit + 2; i++) {
    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `192.168.1.${i % 255}` // Simulate different IP for some tests
        },
        body: JSON.stringify(payload)
      })

      lastResponse = {
        status: response.status,
        headers: {
          'X-RateLimit-Limit': response.headers.get('X-RateLimit-Limit'),
          'X-RateLimit-Remaining': response.headers.get('X-RateLimit-Remaining'),
          'X-RateLimit-Reset': response.headers.get('X-RateLimit-Reset'),
          'Retry-After': response.headers.get('Retry-After')
        }
      }

      if (response.status === 429) {
        rateLimitHit = true
        console.log(`  🚫 Request ${i}: Rate limited (${response.status})`)
        console.log(`     Retry-After: ${response.headers.get('Retry-After')}s`)
      } else if (response.ok) {
        successCount++
        console.log(`  ✅ Request ${i}: Success (${response.status})`)
      } else {
        console.log(`  ⚠️  Request ${i}: ${response.status} - ${await response.text()}`)
      }

      // Show remaining requests if header is present
      const remaining = response.headers.get('X-RateLimit-Remaining')
      if (remaining !== null) {
        console.log(`     Remaining: ${remaining}`)
      }

    } catch (error) {
      console.error(`  ❌ Request ${i}: Error - ${error.message}`)
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log(`\n📈 Results:`)
  console.log(`  Successful requests: ${successCount}`)
  console.log(`  Rate limit triggered: ${rateLimitHit ? 'Yes' : 'No'}`)

  if (lastResponse?.headers) {
    console.log(`\n📋 Rate Limit Headers:`)
    Object.entries(lastResponse.headers).forEach(([key, value]) => {
      if (value) console.log(`  ${key}: ${value}`)
    })
  }

  return rateLimitHit
}

async function runTests() {
  console.log('🔒 Rate Limiting Test Suite')
  console.log('========================\n')

  // Test 1: Admin login rate limit
  await testRateLimit(
    '/api/admin-auth/login',
    {
      email: 'test@example.com',
      password: 'wrongpassword',
      portalKey: 'wrongkey'
    },
    10 // Admin rate limit
  )

  // Test 2: Password reset rate limit
  await testRateLimit(
    '/api/auth/reset-password',
    {
      email: 'test@example.com'
    },
    5 // Auth rate limit
  )

  // Test 3: Letter generation rate limit
  // Note: This will fail without proper auth, but should still hit rate limit
  await testRateLimit(
    '/api/generate-letter',
    {
      letterType: 'Demand Letter',
      intakeData: {
        senderName: 'Test Sender',
        senderAddress: '123 Test St',
        recipientName: 'Test Recipient',
        recipientAddress: '456 Test Ave',
        issueDescription: 'Test issue',
        desiredOutcome: 'Test outcome'
      }
    },
    5 // Letter generation rate limit
  )

  console.log('\n✨ Test suite completed!')
  console.log('\n💡 Tips:')
  console.log('  - If rate limits are not triggered, check if Redis/Upstash is configured')
  console.log('  - For production, ensure KV_REST_API_URL and KV_REST_API_TOKEN are set')
  console.log('  - Rate limits reset based on the configured time windows')
}

// Check if script is run directly
if (require.main === module) {
  runTests().catch(console.error)
}

module.exports = { testRateLimit }