// Create a simple script to execute the migration
const https = require('https');
const fs = require('fs');

// Get credentials from .env.local
const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/)?.[1];
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/)?.[1];

if (!supabaseUrl || !serviceKey) {
  console.error('Could not find Supabase credentials in .env.local');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Project Ref: nomiiqzxaxyxnxndvkbe');

// The SQL to execute
const sql = fs.readFileSync('scripts/012_fix_search_path_add_letter_allowances.sql', 'utf8');

// Method 1: Try using PostgREST with RPC
async function tryPostgREST() {
  console.log('\n=== Attempting to execute via PostgREST ===');

  // Create a temporary RPC function
  const createFunc = `
    CREATE OR REPLACE FUNCTION IF NOT EXISTS temp_exec_migration()
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $func$
    BEGIN
      -- Drop function if it exists
      DROP FUNCTION IF EXISTS add_letter_allowances(UUID, TEXT);

      RETURN 'Function dropped';
    END;
    $func$;
  `;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.pgrst.object+json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        query: createFunc
      })
    });

    console.log('Response status:', response.status);
    const text = await response.text();
    console.log('Response body:', text);

    if (response.ok) {
      console.log('✓ Temporary function created');

      // Execute it
      const execResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/temp_exec_migration`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'apikey': serviceKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('Execution status:', execResponse.status);
      console.log('Execution result:', await execResponse.text());
    }
  } catch (err) {
    console.error('PostgREST error:', err.message);
  }
}

// Method 2: Show instructions for manual execution
function showManualInstructions() {
  console.log('\n=== MANUAL EXECUTION INSTRUCTIONS ===');
  console.log('\nTo apply this migration manually:');
  console.log('1. Open your browser and go to: https://app.supabase.com/project/nomiiqzxaxyxnxndvkbe/sql');
  console.log('2. Copy and paste the following SQL:');
  console.log('\n----------------------------------------');
  console.log(sql);
  console.log('----------------------------------------');
  console.log('\n3. Click "Run" to execute');
  console.log('\nAlternatively, you can run it from the command line using:');
  console.log('\npsql "postgresql://postgres:[YOUR-PASSWORD]@db.nomiiqzxaxyxnxndvkbe.supabase.co:5432/postgres" -f scripts/012_fix_search_path_add_letter_allowances.sql');
  console.log('\n(Replace [YOUR-PASSWORD] with your actual database password)');
}

// Try automatic execution first, then show manual instructions
tryPostgREST().then(() => {
  showManualInstructions();
}).catch(err => {
  console.error('Error:', err);
  showManualInstructions();
});