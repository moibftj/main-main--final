const https = require('https');

// Configuration
const ACCESS_TOKEN = 'sbp_f68a433be9db029bfe87ba6f9e86da4d71829479';
const PROJECT_REF = 'nomiiqzxaxyxnxndvkbe';

console.log('🔧 Final fix for create_employee_coupon with search_path...\n');

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

// Fix create_employee_coupon with proper search_path
async function fixFunction() {
  try {
    // Drop and recreate with exact syntax
    console.log('Step 1: Dropping existing function...');
    await executeSQL('DROP FUNCTION IF EXISTS public.create_employee_coupon(UUID);');

    console.log('Step 2: Creating function with secure search_path...');
    const createSQL = `CREATE OR REPLACE FUNCTION public.create_employee_coupon(emp_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
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
$$;`;

    await executeSQL(createSQL);
    console.log('✅ Function created with search_path!');

    // Verify the fix
    console.log('\nStep 3: Verifying the fix...');
    const verify = await executeSQL(`
      SELECT
        proname,
        prosecdef,
        proconfig
      FROM pg_proc
      WHERE proname = 'create_employee_coupon';
    `);

    if (verify.length > 0) {
      const func = verify[0];
      console.log('\nFunction Details:');
      console.log(`  Name: ${func.proname}`);
      console.log(`  Security Definer: ${func.prosecdef}`);
      console.log(`  Config: ${JSON.stringify(func.proconfig)}`);

      const hasSearchPath = func.proconfig && func.proconfig.includes('search_path=public, pg_catalog');

      if (hasSearchPath) {
        console.log('\n✅ SUCCESS: create_employee_coupon has secure search_path!');
      } else {
        console.log('\n❌ Issue: search_path not properly set');
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the fix
fixFunction();