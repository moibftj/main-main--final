const https = require('https');

// Configuration
const ACCESS_TOKEN = 'sbp_f68a433be9db029bfe87ba6f9e86da4d71829479';
const PROJECT_REF = 'nomiiqzxaxyxnxndvkbe';

console.log('🔍 Checking all SECURITY DEFINER functions for search_path issues...\n');

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

// Check all SECURITY DEFINER functions
async function checkAllFunctions() {
  try {
    const functions = await executeSQL(`
      SELECT
        n.nspname as schema_name,
        p.proname as function_name,
        pg_get_function_arguments(p.oid) as arguments,
        l.lanname as language,
        p.prosecdef as security_definer,
        p.proconfig as config
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      JOIN pg_language l ON p.prolang = l.oid
      WHERE p.prosecdef = true
        AND n.nspname = 'public'
      ORDER BY p.proname;
    `);

    console.log('SECURITY DEFINER functions in public schema:\n');
    console.log('─'.repeat(80));

    let needsFix = [];

    functions.forEach(func => {
      const hasSearchPath = func.config && func.config.some(c => c.includes('search_path'));
      const status = hasSearchPath ? '✅' : '❌';

      console.log(`${status} ${func.schema_name}.${func.function_name}(${func.arguments})`);
      console.log(`    Language: ${func.language}, Has search_path: ${hasSearchPath ? 'YES' : 'NO'}`);

      if (func.config) {
        console.log(`    Config: ${func.config.join(', ')}`);
      }
      console.log('');

      if (!hasSearchPath) {
        needsFix.push(func.function_name);
      }
    });

    console.log('─'.repeat(80));

    if (needsFix.length > 0) {
      console.log(`\n⚠️  Found ${needsFix.length} functions that need search_path fix:`);
      needsFix.forEach(f => console.log(`   • ${f}`));
      console.log('\nThese functions are vulnerable to search_path manipulation!');
    } else {
      console.log('\n✅ All SECURITY DEFINER functions have secure search_path configuration!');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// Run the check
checkAllFunctions();