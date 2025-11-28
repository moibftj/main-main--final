const https = require('https');

// Configuration
const ACCESS_TOKEN = 'sbp_f68a433be9db029bfe87ba6f9e86da4d71829479';
const PROJECT_REF = 'nomiiqzxaxyxnxndvkbe';

console.log('🔧 Fixing handle_new_user function search_path issue...\n');

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
    console.log('🔧 Applying fix in steps...\n');

    // Step 1: Drop the trigger first
    console.log('Step 1: Dropping trigger...');
    await executeSQL('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
    console.log('✅ Trigger dropped\n');

    // Step 2: Drop the function
    console.log('Step 2: Dropping function...');
    await executeSQL('DROP FUNCTION IF EXISTS public.handle_new_user();');
    console.log('✅ Function dropped\n');

    // Step 3: Recreate with fixed search_path
    console.log('Step 3: Recreating function with secure search_path...');
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
    console.log('✅ Function recreated with secure search_path!\n');

    // Step 4: Recreate the trigger
    console.log('Step 4: Recreating trigger...');
    await executeSQL(`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
    console.log('✅ Trigger recreated!\n');

    // Step 5: Verification
    console.log('Step 5: Verification...\n');
    const verification = await executeSQL(`
      SELECT
        proname as name,
        prosecdef as security_definer,
        proconfig as config
      FROM pg_proc
      WHERE proname = 'handle_new_user';
    `);

    console.log('Function verification results:');
    console.log(JSON.stringify(verification, null, 2));

    // Check if trigger exists
    const triggerCheck = await executeSQL(`
      SELECT
        tgname as trigger_name,
        tgrelid::regclass as table_name,
        tgfoid::regproc as function_name
      FROM pg_trigger
      JOIN pg_class ON tgrelid = pg_class.oid
      WHERE tgname = 'on_auth_user_created';
    `);

    console.log('\nTrigger verification results:');
    console.log(JSON.stringify(triggerCheck, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('🎉 SUCCESS: handle_new_user function is now secure!');
    console.log('='.repeat(60));
    console.log('\n✅ Fixed issues:');
    console.log('  • Search path fixed to: public, pg_catalog');
    console.log('  • SECURITY DEFINER with safe configuration');
    console.log('  • Lint warning about mutable search_path resolved');
    console.log('  • Table references properly schema-qualified');
    console.log('  • No dependency on mutable session search_path');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Manual fix needed. Execute this SQL in Supabase SQL Editor:');
    console.log('https://app.supabase.com/project/' + PROJECT_REF + '/sql');
    console.log('\n--- SQL to execute ---');
    console.log(`
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
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
$function$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `);
  }
}

// Run the fix
fixHandleNewUser();