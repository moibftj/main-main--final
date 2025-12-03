const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function executeSQL(sql) {
  console.log('Executing SQL:', sql.substring(0, 100) + '...');

  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${serviceKey}`,
      'apikey': serviceKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    body: JSON.stringify({ query: sql })
  });

  const text = await response.text();

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return text;
}

async function applyMigration() {
  try {
    const migrationSQL = fs.readFileSync('scripts/012_fix_search_path_add_letter_allowances.sql', 'utf8');

    console.log('Applying migration to fix search_path for add_letter_allowances function...\n');

    // Create a temporary SQL function to execute our SQL
    const createTempFunction = `
      CREATE OR REPLACE FUNCTION temp_exec_sql()
      RETURNS void AS $$
      BEGIN
        ${migrationSQL.replace(/\$\$/g, '$function$')}
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Execute the function
    await executeSQL(createTempFunction);

    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/temp_exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✓ Migration applied successfully!');
    } else {
      const error = await response.text();
      console.error('Error:', error);
    }

    // Clean up the temporary function
    await executeSQL('DROP FUNCTION IF EXISTS temp_exec_sql();');

  } catch (err) {
    console.error('Error applying migration:', err.message);

    // If all else fails, print the SQL so it can be run manually
    console.log('\n--- Please run this SQL manually in Supabase SQL Editor ---');
    console.log(fs.readFileSync('scripts/012_fix_search_path_add_letter_allowances.sql', 'utf8'));
  }
}

applyMigration();