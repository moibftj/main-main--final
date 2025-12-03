# Rate Limiting Implementation

This document explains the rate limiting implementation for the Talk-To-My-Lawyer platform.

## Overview

Rate limiting has been implemented to protect against:
- Brute force attacks on authentication endpoints
- DoS attacks on resource-intensive operations
- API abuse and spam
- Cost control for AI-powered features

## Configuration

### Production (Recommended)
The system uses **Upstash Redis** for distributed rate limiting. To configure:

1. Create a free Upstash Redis database at https://console.upstash.com/redis
2. Add the following environment variables to your deployment:

```bash
# Rate Limiting (Upstash Redis)
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token
KV_REST_API_READ_ONLY_TOKEN=your-readonly-token
REDIS_URL=rediss://default:your-token@your-redis-url.upstash.io:6379
```

### Development (Fallback)
If Redis is not configured, the system automatically falls back to in-memory rate limiting.

## Rate Limits by Endpoint

| Endpoint Type | Rate Limit | Window | Purpose |
|---------------|------------|--------|---------|
| Admin Login | 10 requests | 15 minutes | Prevent admin credential stuffing |
| User Auth (Reset/Update Password) | 5 requests | 15 minutes | Prevent password reset spam |
| Letter Generation | 5 requests | 1 hour | Control AI costs and abuse |
| Subscription Creation | 3 requests | 1 hour | Prevent subscription abuse |
| Admin Operations (Approve/Improve) | 10 requests | 15 minutes | Rate limit admin panel |
| General API | 100 requests | 1 minute | General API protection |

## Implementation Details

### Files Modified

1. **Rate Limiter Library**: `/lib/rate-limit-redis.ts`
   - Primary rate limiting implementation
   - Uses Upstash Redis with in-memory fallback
   - Includes IP-based identification

2. **Protected Endpoints**:
   - `/api/admin-auth/login` - Admin authentication
   - `/api/auth/reset-password` - Password reset requests
   - `/api/auth/update-password` - Password updates
   - `/api/generate-letter` - AI letter generation
   - `/api/create-checkout` - Subscription creation
   - `/api/letters/[id]/approve` - Admin letter approval
   - `/api/letters/[id]/improve` - AI letter improvement

### Response Headers

When rate limiting is active, the following headers are included:

```http
X-RateLimit-Limit: 10          # Maximum requests allowed
X-RateLimit-Remaining: 7       # Requests remaining in window
X-RateLimit-Reset: 1703952000  # Unix timestamp when window resets
Retry-After: 900               # Seconds to wait before retrying
```

### Rate Limit Exceeded Response

```json
{
  "error": "Rate limit exceeded. Please try again later.",
  "retryAfter": 900,
  "limit": 10,
  "remaining": 0,
  "reset": 1703952000
}
```

## Testing

Run the rate limiting test script:

```bash
# First, ensure your server is running
npm run dev

# Then run the test script
node scripts/test-rate-limiting.js

# With custom base URL
BASE_URL=https://your-production-url.com node scripts/test-rate-limiting.js
```

## Monitoring

Rate limiting includes analytics when using Upstash Redis:

1. Visit your Upstash Redis console
2. Check the "Analytics" tab
3. Monitor rate limit hits and patterns

## Best Practices

### For Developers

1. **Always apply rate limiting** to new authentication endpoints
2. **Use appropriate limits** based on endpoint sensitivity
3. **Include rate limit info** in API documentation
4. **Test rate limits** during development

### Custom Rate Limits

To add rate limiting to a new endpoint:

```typescript
import { safeApplyRateLimit, authRateLimit } from '@/lib/rate-limit-redis'

export async function POST(request: NextRequest) {
  // Apply rate limiting
  const rateLimitResponse = await safeApplyRateLimit(
    request,
    authRateLimit,
    5,      // Fallback limit
    "15 m"  // Fallback window
  )
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  // Your endpoint logic here...
}
```

### Creating Custom Rate Limiters

```typescript
import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

const customRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.fixedWindow(20, "10 m"), // 20 requests per 10 minutes
  analytics: true,
  prefix: "custom-feature",
})
```

## Security Considerations

1. **IP-based Identification**: Rate limits are primarily IP-based
2. **Distributed Protection**: Redis ensures limits work across multiple server instances
3. **No Bypass**: Rate limits are applied before authentication to prevent enumeration
4. **Graceful Degradation**: In-memory fallback ensures protection even if Redis fails

## Troubleshooting

### Rate Limits Not Working

1. **Check Environment Variables**: Ensure Redis credentials are properly set
2. **Verify Redis Connection**: Test Redis connectivity from your server
3. **Check Logs**: Look for Redis-related errors in server logs

### Too Many Rate Limit Blocks

1. **Adjust Limits**: Consider increasing limits if legitimate users are affected
2. **Add User-based Limits**: Implement per-user limits for authenticated endpoints
3. **Monitor Abuse**: Check analytics for attack patterns

### Performance Issues

1. **Redis Latency**: Ensure Redis region is close to your server
2. **Connection Pooling**: Upstash Redis handles this automatically
3. **Batch Operations**: Minimize Redis round trips

## Production Deployment

### Required Environment Variables

Add these to your production environment:

```bash
# Rate Limiting
KV_REST_API_URL=https://your-redis-url.upstash.io
KV_REST_API_TOKEN=your-redis-token
KV_REST_API_READ_ONLY_TOKEN=your-readonly-token
REDIS_URL=rediss://default:your-token@your-redis-url.upstash.io:6379
```

### Vercel Deployment

1. Add environment variables in Vercel dashboard
2. Deploy as usual
3. Verify rate limiting in production with test script

### Other Platforms

Ensure your hosting platform allows outbound connections to Redis (port 6379).

## Future Enhancements

1. **User-based Rate Limiting**: Track limits per user ID for authenticated endpoints
2. **Sliding Window**: Implement sliding window algorithm for smoother limits
3. **Adaptive Rate Limiting**: Adjust limits based on traffic patterns
4. **Geographic Limits**: Apply different limits by region
5. **Machine Learning**: Detect and block sophisticated attack patterns

## Support

For issues with rate limiting:
1. Check Upstash Redis status
2. Review application logs
3. Run the test script to diagnose
4. Check this documentation for common solutions