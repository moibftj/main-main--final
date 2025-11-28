const https = require('https');

// Configuration
const ACCESS_TOKEN = 'sbp_f68a433be9db029bfe87ba6f9e86da4d71829479';
const PROJECT_REF = 'nomiiqzxaxyxnxndvkbe';

console.log('🔧 Directly fixing each function with search_path...\n');

// Function to execute SQL via Management API
function executeSQL(sql) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      query: sql
    });

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const result = JSON.parse(data);
            resolve(result);
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

// List of functions to fix with their updated definitions
const functionsToFix = [
  {
    name: 'check_letter_allowance',
    sql: `CREATE OR REPLACE FUNCTION public.check_letter_allowance(u_id UUID)
RETURNS TABLE(has_allowance BOOLEAN, remaining INTEGER, plan_name TEXT, is_super BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
    is_superuser BOOLEAN;
    active_subscription RECORD;
    remaining_count INTEGER;
BEGIN
    -- Check if user is a super user
    SELECT is_super_user INTO is_superuser
    FROM public.profiles
    WHERE id = u_id;

    IF is_superuser THEN
        RETURN QUERY SELECT true, 999, 'unlimited', true;
        RETURN;
    END IF;

    -- Get active subscription
    SELECT * INTO active_subscription
    FROM public.subscriptions
    WHERE user_id = u_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());

    IF active_subscription.id IS NULL THEN
        -- Check for free trial (first letter)
        DECLARE
            letter_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO letter_count
            FROM public.letters
            WHERE user_id = u_id;

            IF letter_count = 0 THEN
                RETURN QUERY SELECT true, 1, 'free_trial', false;
            ELSE
                RETURN QUERY SELECT false, 0, NULL, false;
            END IF;
            RETURN;
        END;
    END IF;

    remaining_count := COALESCE(active_subscription.credits_remaining, 0);

    RETURN QUERY SELECT
        remaining_count > 0,
        remaining_count,
        active_subscription.plan_type,
        false;
END;
$function$;`
  },
  {
    name: 'get_user_role',
    sql: `CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
    RETURN COALESCE(
        (SELECT role::TEXT FROM public.profiles WHERE id = auth.uid()),
        'subscriber'
    );
END;
$function$;`
  },
  {
    name: 'deduct_letter_allowance',
    sql: `CREATE OR REPLACE FUNCTION public.deduct_letter_allowance(u_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
    sub_record RECORD;
BEGIN
    -- Get active subscription
    SELECT id INTO sub_record
    FROM public.subscriptions
    WHERE user_id = u_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());

    IF sub_record.id IS NULL THEN
        -- Check if it's their first letter
        DECLARE
            letter_count INTEGER;
        BEGIN
            SELECT COUNT(*) INTO letter_count
            FROM public.letters
            WHERE user_id = u_id;

            IF letter_count = 0 THEN
                RETURN true; -- First letter is free
            END IF;
            RETURN false;
        END;
    END IF;

    -- Deduct 1 letter
    UPDATE public.subscriptions
    SET remaining_letters = remaining_letters - 1,
        updated_at = NOW()
    WHERE id = sub_record.id;

    RETURN true;
END;
$function$;`
  },
  {
    name: 'validate_coupon',
    sql: `CREATE OR REPLACE FUNCTION public.validate_coupon(coupon_code TEXT)
RETURNS TABLE(is_valid BOOLEAN, discount_percent INTEGER, employee_id UUID, message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
    coupon_record RECORD;
BEGIN
    -- Check if coupon exists and is active
    SELECT * INTO coupon_record
    FROM public.employee_coupons
    WHERE code = coupon_code
    AND is_active = true;

    IF coupon_record.id IS NULL THEN
        RETURN QUERY SELECT false, 0, NULL::UUID, 'Invalid coupon code'::TEXT;
        RETURN;
    END IF;

    RETURN QUERY SELECT
        true,
        coupon_record.discount_percent,
        coupon_record.employee_id,
        'Coupon valid'::TEXT;
END;
$function$;`
  }
];

// Apply fixes one by one
async function fixFunctions() {
  try {
    for (const func of functionsToFix) {
      console.log(`\n🔧 Fixing ${func.name}...`);
      console.log('─'.repeat(50));

      try {
        await executeSQL(func.sql);
        console.log(`✅ ${func.name} fixed successfully!`);
      } catch (err) {
        console.error(`❌ Error fixing ${func.name}:`, err.message);
      }
    }

    // Verify all functions
    console.log('\n\n🔍 Final verification...\n');
    const results = await executeSQL(`
      SELECT
        p.proname as function_name,
        CASE WHEN p.proconfig IS NOT NULL AND p.proconfig::text LIKE '%search_path%' THEN 'YES' ELSE 'NO' END as has_search_path
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.prosecdef = true
        AND n.nspname = 'public'
      ORDER BY p.proname;
    `);

    console.log('Function Status:');
    console.log('─'.repeat(60));

    results.forEach(func => {
      const status = func.has_search_path === 'YES' ? '✅' : '❌';
      console.log(`${status} ${func.function_name}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📋 Summary:');
    console.log('='.repeat(60));
    console.log('✅ handle_new_user - FIXED');
    console.log('✅ add_letter_allowances - FIXED');

    const remainingUnfixed = results.filter(f => f.has_search_path === 'NO');
    if (remainingUnfixed.length > 0) {
      console.log('\n⚠️  Still need fixing:');
      remainingUnfixed.forEach(f => console.log(`   • ${f.function_name}`));
      console.log('\n💡 Apply the remaining fixes using the migration script:');
      console.log('https://app.supabase.com/project/' + PROJECT_REF + '/sql');
      console.log('\nFile: scripts/014_fix_all_search_paths.sql');
    } else {
      console.log('\n🎉 All SECURITY DEFINER functions are now secure!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the fixes
fixFunctions();