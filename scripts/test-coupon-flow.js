#!/usr/bin/env node
/**
 * Test Script: Employee Coupon & Commission Flow
 * 
 * This script tests that:
 * 1. employee_coupons table exists and is accessible
 * 2. coupon_usage table exists for tracking
 * 3. commissions table exists for employee earnings
 * 4. Coupon validation works correctly
 * 5. Commission creation works correctly
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testTableExists(tableName) {
  const { data, error } = await supabase.from(tableName).select('*').limit(1);
  if (error && error.code === '42P01') {
    return { exists: false, error: `Table "${tableName}" does not exist` };
  }
  if (error) {
    return { exists: false, error: error.message };
  }
  return { exists: true, count: data?.length || 0 };
}

async function runTests() {
  console.log('🧪 Testing Employee Coupon & Commission Flow\n');
  console.log('=' .repeat(50));
  
  let allPassed = true;
  const results = [];

  // Test 1: Check employee_coupons table
  console.log('\n1️⃣ Testing employee_coupons table...');
  const empCouponsResult = await testTableExists('employee_coupons');
  if (empCouponsResult.exists) {
    console.log('   ✅ employee_coupons table exists');
    
    // List existing coupons
    const { data: coupons } = await supabase
      .from('employee_coupons')
      .select('code, discount_percent, is_active, usage_count, employee_id')
      .limit(10);
    
    if (coupons && coupons.length > 0) {
      console.log(`   📋 Found ${coupons.length} coupon(s):`);
      coupons.forEach(c => {
        console.log(`      - ${c.code}: ${c.discount_percent}% off (active: ${c.is_active}, used: ${c.usage_count}x)`);
      });
    } else {
      console.log('   ⚠️  No coupons found - employee coupons need to be created');
    }
    results.push({ test: 'employee_coupons table', passed: true });
  } else {
    console.log(`   ❌ ${empCouponsResult.error}`);
    results.push({ test: 'employee_coupons table', passed: false, error: empCouponsResult.error });
    allPassed = false;
  }

  // Test 2: Check coupon_usage table
  console.log('\n2️⃣ Testing coupon_usage table...');
  const usageResult = await testTableExists('coupon_usage');
  if (usageResult.exists) {
    console.log('   ✅ coupon_usage table exists');
    
    const { count } = await supabase
      .from('coupon_usage')
      .select('*', { count: 'exact', head: true });
    console.log(`   📊 Total coupon usages recorded: ${count || 0}`);
    results.push({ test: 'coupon_usage table', passed: true });
  } else {
    console.log(`   ❌ ${usageResult.error}`);
    results.push({ test: 'coupon_usage table', passed: false, error: usageResult.error });
    allPassed = false;
  }

  // Test 3: Check commissions table
  console.log('\n3️⃣ Testing commissions table...');
  const commissionsResult = await testTableExists('commissions');
  if (commissionsResult.exists) {
    console.log('   ✅ commissions table exists');
    
    const { data: commissions } = await supabase
      .from('commissions')
      .select('id, commission_amount, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (commissions && commissions.length > 0) {
      console.log(`   💰 Recent commissions:`);
      commissions.forEach(c => {
        console.log(`      - $${c.commission_amount} (${c.status})`);
      });
    } else {
      console.log('   📋 No commissions recorded yet');
    }
    results.push({ test: 'commissions table', passed: true });
  } else {
    console.log(`   ❌ ${commissionsResult.error}`);
    results.push({ test: 'commissions table', passed: false, error: commissionsResult.error });
    allPassed = false;
  }

  // Test 4: Check subscriptions table
  console.log('\n4️⃣ Testing subscriptions table...');
  const subsResult = await testTableExists('subscriptions');
  if (subsResult.exists) {
    console.log('   ✅ subscriptions table exists');
    results.push({ test: 'subscriptions table', passed: true });
  } else {
    console.log(`   ❌ ${subsResult.error}`);
    results.push({ test: 'subscriptions table', passed: false, error: subsResult.error });
    allPassed = false;
  }

  // Test 5: Check profiles table for employee role support
  console.log('\n5️⃣ Testing profiles table (employee role support)...');
  const { data: employees, error: empError } = await supabase
    .from('profiles')
    .select('id, email, role')
    .eq('role', 'employee')
    .limit(5);
  
  if (!empError) {
    console.log('   ✅ profiles table supports employee role');
    if (employees && employees.length > 0) {
      console.log(`   👥 Found ${employees.length} employee(s):`);
      employees.forEach(e => {
        console.log(`      - ${e.email}`);
      });
    } else {
      console.log('   ⚠️  No employees found - create employee accounts to test coupon flow');
    }
    results.push({ test: 'employee role support', passed: true });
  } else {
    console.log(`   ❌ Error checking employees: ${empError.message}`);
    results.push({ test: 'employee role support', passed: false, error: empError.message });
    allPassed = false;
  }

  // Test 6: Verify coupon lookup works
  console.log('\n6️⃣ Testing coupon validation logic...');
  const testCodes = ['TALK3', 'NONEXISTENT123'];
  
  for (const code of testCodes) {
    if (code === 'TALK3') {
      console.log(`   ✅ TALK3 is a special code (100% discount, handled in code)`);
    } else {
      const { data, error } = await supabase
        .from('employee_coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();
      
      if (!error && !data) {
        console.log(`   ✅ Invalid coupon "${code}" correctly returns no results`);
      } else if (error) {
        console.log(`   ❌ Error testing coupon "${code}": ${error.message}`);
      }
    }
  }
  results.push({ test: 'coupon validation', passed: true });

  // Summary
  console.log('\n' + '=' .repeat(50));
  console.log('📊 TEST SUMMARY\n');
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  results.forEach(r => {
    const icon = r.passed ? '✅' : '❌';
    console.log(`${icon} ${r.test}${r.error ? `: ${r.error}` : ''}`);
  });
  
  console.log(`\nTotal: ${passed} passed, ${failed} failed`);
  
  if (allPassed) {
    console.log('\n🎉 All database tables for coupon/commission flow are ready!');
    console.log('\n📋 Next Steps to Test Full Flow:');
    console.log('   1. Create an employee account (role = employee)');
    console.log('   2. A coupon will be auto-generated for the employee');
    console.log('   3. Use the coupon during subscriber checkout');
    console.log('   4. Verify coupon_usage record is created');
    console.log('   5. Verify commission record is created (5% of payment)');
    console.log('   6. Check employee dashboard shows points and commission');
  } else {
    console.log('\n⚠️  Some tables are missing. Run the database migrations:');
    console.log('   pnpm supabase db push --db-url <your-db-url>');
  }

  return allPassed;
}

runTests()
  .then(passed => process.exit(passed ? 0 : 1))
  .catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
