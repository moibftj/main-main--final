#!/bin/bash

# Set the access token
export SUPABASE_ACCESS_TOKEN=sbp_f68a433be9db029bfe87ba6f9e86da4d71829479

# Project reference
PROJECT_REF="nomiiqzxaxyxnxndvkbe"

echo "Project: $PROJECT_REF"
echo "Applying migration to fix search_path for add_letter_allowances function..."

# Create a temporary file with the JSON payload
cat > /tmp/migration_payload.json << 'EOF'
{
  "sql": "-- Fix search_path for add_letter_allowances function\n-- This addresses the lint warning about mutable search_path\n\nDROP FUNCTION IF EXISTS add_letter_allowances(UUID, TEXT);\n\nCREATE FUNCTION add_letter_allowances(sub_id UUID, plan TEXT)\nRETURNS VOID\nLANGUAGE plpgsql\nSECURITY DEFINER\nSET search_path = public, pg_catalog\nAS $$\nDECLARE\n    letters_to_add INT;\nBEGIN\n    IF plan = 'one_time' THEN\n        letters_to_add := 1;\n    ELSIF plan = 'standard_4_month' THEN\n        letters_to_add := 4;\n    ELSIF plan = 'premium_8_month' THEN\n        letters_to_add := 8;\n    ELSE\n        RAISE EXCEPTION 'Invalid plan type: %', plan;\n    END IF;\n\n    UPDATE public.subscriptions\n    SET remaining_letters = letters_to_add,\n        last_reset_at = NOW(),\n        updated_at = NOW()\n    WHERE id = sub_id;\nEND;\n$$;"
}
EOF

echo "Executing migration..."
curl -X POST "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d @/tmp/migration_payload.json

echo -e "\n---"
rm -f /tmp/migration_payload.json

echo "Checking function status..."
curl -X GET "https://api.supabase.com/v1/projects/$PROJECT_REF/database/functions" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" | jq '.functions[] | select(.name=="add_letter_allowances") | {name, schema, language, security_definer}' 2>/dev/null || echo "Function check complete"