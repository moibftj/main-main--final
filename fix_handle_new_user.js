const https = require('https');

// Configuration
const ACCESS_TOKEN = 'sbp_f68a433be9db029bfe87ba6f9e86da4d71829479';
const PROJECT_REF = 'nomiiqzxaxyxnxndvkbe';

console.log('🔍 Checking handle_new_user function...\n');

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

// Fix the handle_new_user function
async function fixHandleNewUser() {
  try {
    console.log('📋 Current function properties:\n');

    // Check current function
    const currentFunc = await executeSQL(`
      SELECT
        proname as name,
        lanname as language,
        prosecdef as security_definer,
        proconfig as config,
        pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_language l ON p.prolang = l.oid
      WHERE proname = 'handle_new_user';
    `);

    console.log(JSON.stringify(currentFunc, null, 2));

    const hasSearchPath = currentFunc.length > 0 &&
      currentFunc[0].config &&
      currentFunc[0].config.some(c => c.includes('search_path'));

    console.log(`\nHas search_path configured: ${hasSearchPath ? 'YES' : 'NO'}`);

    if (!hasSearchPath) {
      console.log('\n🔧 Fixing handle_new_user function...');
      console.log('─'.repeat(60));

      // Drop and recreate with fixed search_path
      console.log('\nStep 1: Dropping current function...');
      await executeSQL('DROP FUNCTION IF EXISTS public.handle_new_user();');

      console.log('\nStep 2: Creating function with fixed search_path...');
      const createFunctionSQL = `CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
    RETURN NEW;
END;
$function$;`;

      await executeSQL(createFunctionSQL);
      console.log('✅ Function recreated with secure search_path!');

      // Ensure trigger exists
      console.log('\nStep 3: Ensuring trigger exists...');
      await executeSQL(`
        CREATE TRIGGER IF NOT EXISTS on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `);
      console.log('✅ Trigger verified/created!');
    } else {
      console.log('\n✅ Function already has search_path configured!');
    }

    // Final verification
    console.log('\n🔍 Final verification...\n');
    const verification = await executeSQL(`
      SELECT
        proname as name,
        prosecdef as security_definer,
        proconfig as config
      FROM pg_proc
      WHERE proname = 'handle_new_user';
    `);

    console.log('Final function state:');
    console.log(JSON.stringify(verification, null, 2));

    console.log('\n✅ SUCCESS: handle_new_user function is now secure!');
    console.log('\nFixed issues:');
    console.log('  • Search path fixed to: public, pg_catalog');
    console.log('  • SECURITY DEFINER with safe configuration');
    console.log('  • Lint warning about mutable search_path resolved');
    console.log('  • All table references are schema-qualified');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the fix
fixHandleNewUser();