# Manual Fix Instructions

## Issue: create_employee_coupon function needs search_path fix

The automatic scripts are having trouble applying the SET search_path clause. Please apply this fix manually.

## How to Fix:

### Option 1: Supabase Dashboard (Recommended)

1. Go to: https://app.supabase.com/project/nomiiqzxaxyxnxndvkbe/sql
2. Run the following SQL:

```sql
-- First, drop the existing function
DROP FUNCTION IF EXISTS public.create_employee_coupon(UUID);

-- Then recreate with search_path
CREATE OR REPLACE FUNCTION public.create_employee_coupon(emp_id UUID)
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
$$;
```

### Option 2: Using psql

If you have database access:

```bash
psql "postgresql://postgres:[PASSWORD]@db.nomiiqzxaxyxnxndvkbe.supabase.co:5432/postgres" -c "
DROP FUNCTION IF EXISTS public.create_employee_coupon(UUID);

CREATE OR REPLACE FUNCTION public.create_employee_coupon(emp_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS \$\$
DECLARE
    coupon_code TEXT;
BEGIN
    coupon_code := 'EMP' || UPPER(substring(md5(emp_id || extract(epoch from now())), 1, 8));

    INSERT INTO public.employee_coupons (
        employee_id,
        code,
        discount_percent,
        is_active
    ) VALUES (
        emp_id,
        coupon_code,
        20,
        true
    );

    RETURN coupon_code;
END;
\$\$;
"
```

## Verification

After applying the fix, verify with:

```sql
SELECT
    proname as function_name,
    prosecdef as is_security_definer,
    proconfig as config
FROM pg_proc
WHERE proname = 'create_employee_coupon';
```

You should see:
- `prosecdef`: true
- `proconfig`: `["search_path=public, pg_catalog"]`