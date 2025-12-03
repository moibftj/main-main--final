const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function applyMigration() {
  try {
    const migrationSQL = fs.readFileSync('scripts/012_fix_search_path_add_letter_allowances.sql', 'utf8');

    console.log('Applying migration...');

    const { data, error } = await supabase.rpc('exec', { sql: migrationSQL });

    if (error) {
      // Try using raw SQL if rpc fails
      console.log('RPC failed, trying direct SQL execution...');

      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--'));

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 100) + '...');

        // Use the Postgres REST API to execute SQL
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/sql_exec`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ query: statement })
        });

        if (!response.ok && !response.status.toString().startsWith('2')) {
          const errorText = await response.text();
          console.error('Error executing statement:', errorText);
        } else {
          console.log('✓ Statement executed successfully');
        }
      }
    } else {
      console.log('Migration applied successfully!');
    }
  } catch (err) {
    console.error('Error applying migration:', err);
  }
}

applyMigration();