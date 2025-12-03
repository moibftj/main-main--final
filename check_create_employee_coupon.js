const https = require('https');

// Configuration
const ACCESS_TOKEN = 'sbp_f68a433be9db029bfe87ba6f9e86da4d71829479';
const PROJECT_REF = 'nomiiqzxaxyxnxndvkbe';

console.log('🔍 Checking create_employee_coupon function status...\n');

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

// Check and fix create_employee_coupon
async function checkAndFixFunction() {
  try {
    // Check current status
    console.log('Checking create_employee_coupon function...');
    const result = await executeSQL(`
      SELECT
        p.proname as function_name,
        p.prosecdef as security_definer,
        p.proconfig as config,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.proname = 'create_employee_coupon'
        AND n.nspname = 'public';
    `);

    if (result.length === 0) {
      console.log('❌ Function not found. Creating it...');

      // Create the function
      const createSQL = `CREATE OR REPLACE FUNCTION public.create_employee_coupon(emp_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
    coupon_code TEXT;
BEGIN
    -- Generate unique coupon code
    coupon_code := 'EMP' || UPPER(substring(md5(emp_id || extract(epoch from now())), 1, 8));

    INSERT INTO public.employee_coupons (
        employee_id,
        code,
        discount_percent,
        is_active
    ) VALUES (
        emp_id,
        coupon_code,
        20, -- 20% discount
        true
    );

    RETURN coupon_code;
END;
$function$;`;

      await executeSQL(createSQL);
      console.log('✅ create_employee_coupon created with secure search_path!');

    } else {
      const func = result[0];
      const hasSearchPath = func.config && func.config.some(c => c.includes('search_path'));

      console.log('Current function status:');
      console.log(`  Security Definer: ${func.security_definer}`);
      console.log(`  Has search_path: ${hasSearchPath ? 'YES' : 'NO'}`);

      if (!hasSearchPath) {
        console.log('\n⚠️  Function lacks search_path. Recreating...');

        // Drop and recreate with search_path
        await executeSQL('DROP FUNCTION IF EXISTS public.create_employee_coupon(UUID);');

        const createSQL = `CREATE OR REPLACE FUNCTION public.create_employee_coupon(emp_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
DECLARE
    coupon_code TEXT;
BEGIN
    -- Generate unique coupon code
    coupon_code := 'EMP' || UPPER(substring(md5(emp_id || extract(epoch from now())), 1, 8));

    INSERT INTO public.employee_coupons (
        employee_id,
        code,
        discount_percent,
        is_active
    ) VALUES (
        emp_id,
        coupon_code,
        20, -- 20% discount
        true
    );

    RETURN coupon_code;
END;
$function$;`;

        await executeSQL(createSQL);
        console.log('✅ create_employee_coupon recreated with secure search_path!');
      } else {
        console.log('✅ Function already has search_path configured');
      }
    }

    // Final verification
    console.log('\n🔍 Final verification...');
    const verify = await executeSQL(`
      SELECT
        proname as function_name,
        CASE WHEN proconfig IS NOT NULL AND proconfig::text LIKE '%search_path%'
             THEN 'YES' ELSE 'NO' END as has_search_path
      FROM pg_proc
      WHERE proname = 'create_employee_coupon';
    `);

    console.log('Final Status:');
    console.log(`  Function: ${verify[0].function_name}`);
    console.log(`  Search Path: ${verify[0].has_search_path}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the check
checkAndFixFunction();