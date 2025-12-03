const https = require('https');
const fs = require('fs');

// Configuration
const ACCESS_TOKEN = 'sbp_f68a433be9db029bfe87ba6f9e86da4d71829479';
const PROJECT_REF = 'nomiiqzxaxyxnxndvkbe';

console.log('🔧 Applying search_path fixes to all SECURITY DEFINER functions...\n');

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

// Apply all fixes
async function applyAllFixes() {
  try {
    console.log('📝 Reading migration script...');
    const migrationSQL = fs.readFileSync('scripts/014_fix_all_search_paths.sql', 'utf8');

    // Split into individual function definitions
    const functions = migrationSQL.split(/\n\n-- \d+\./);
    functions.shift(); // Remove empty first element

    console.log(`Found ${functions.length} functions to fix\n`);

    for (let i = 0; i < functions.length; i++) {
      const func = functions[i];
      const match = func.match(/-- (\d+)\. (\w+)/);
      if (!match) continue;

      const funcNum = match[1];
      const funcName = match[2];

      console.log(`\n${funcNum}. Fixing ${funcName}...`);
      console.log('─'.repeat(50));

      // Extract just the CREATE FUNCTION statement
      const createFuncMatch = func.match(/CREATE OR REPLACE FUNCTION public\.(\w+)/);
      if (!createFuncMatch) continue;

      const fullFunctionSQL = `CREATE OR REPLACE FUNCTION public.${funcName}${func.split(`CREATE OR REPLACE FUNCTION public.${funcName}`)[1]}`;

      try {
        await executeSQL(fullFunctionSQL);
        console.log(`✅ ${funcName} fixed successfully!`);
      } catch (err) {
        console.error(`❌ Error fixing ${funcName}:`, err.message);
      }
    }

    // Final verification
    console.log('\n\n🔍 Final verification...\n');
    const verifySQL = `
      SELECT
        p.proname as function_name,
        CASE WHEN p.proconfig IS NOT NULL AND p.proconfig::text LIKE '%search_path%' THEN 'YES' ELSE 'NO' END as has_search_path,
        p.proconfig as config
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE p.prosecdef = true
        AND n.nspname = 'public'
      ORDER BY p.proname;
    `;

    const results = await executeSQL(verifySQL);

    console.log('\nFunction Status After Fix:');
    console.log('─'.repeat(80));

    let allFixed = true;
    results.forEach(func => {
      const status = func.has_search_path === 'YES' ? '✅' : '❌';
      console.log(`${status} ${func.function_name} - search_path: ${func.has_search_path}`);
      if (func.has_search_path === 'NO') allFixed = false;
    });

    console.log('─'.repeat(80));

    if (allFixed) {
      console.log('\n🎉 SUCCESS: All SECURITY DEFINER functions now have secure search_path!');
      console.log('\n✅ All lint warnings about mutable search_path have been resolved!');
    } else {
      console.log('\n⚠️  Some functions still need fixing. Please check manually.');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Manual application may be required.');
    console.log('Apply the migration at: https://app.supabase.com/project/' + PROJECT_REF + '/sql');
  }
}

// Run the fixes
applyAllFixes();