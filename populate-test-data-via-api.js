// Script to populate test data via Supabase REST API
// Run with: node populate-test-data-via-api.js

const SUPABASE_URL = 'https://nomiiqzxaxyxnxndvkbe.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vbWlpcXp4YXh5eG54bmR2a2JlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA3OTYyNCwiZXhwIjoyMDc5NjU1NjI0fQ.xxzjUylj-eEO91fnugufUfk_X2tSlM_-wWapkhoYs5I'

const headers = {
  'apikey': SUPABASE_SERVICE_ROLE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'resolution=merge-duplicates'
}

// Test data
const testData = {
  profiles: [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'john.doe@example.com',
      full_name: 'John Doe',
      role: 'subscriber',
      phone: '555-0101',
      company_name: 'Doe Enterprises'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'jane.smith@example.com',
      full_name: 'Jane Smith',
      role: 'subscriber',
      phone: '555-0102',
      company_name: 'Smith Consulting'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'robert.johnson@example.com',
      full_name: 'Robert Johnson',
      role: 'subscriber',
      phone: '555-0103',
      company_name: 'Johnson & Co'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'emily.wilson@example.com',
      full_name: 'Emily Wilson',
      role: 'subscriber',
      phone: '555-0104',
      company_name: 'Wilson Legal Services'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      email: 'michael.brown@example.com',
      full_name: 'Michael Brown',
      role: 'subscriber',
      phone: '555-0105',
      company_name: 'Brown Corporation'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440101',
      email: 'sarah.employee@example.com',
      full_name: 'Sarah Employee',
      role: 'employee',
      phone: '555-0201',
      company_name: 'Legal Referrals Inc'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440102',
      email: 'david.partner@example.com',
      full_name: 'David Partner',
      role: 'employee',
      phone: '555-0202',
      company_name: 'Partner Legal Solutions'
    }
  ],
  subscriptions: [
    {
      id: 'sub001',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      plan: 'monthly',
      status: 'active',
      price: 299.00,
      discount: 0,
      credits_remaining: 3,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sub002',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      plan: 'yearly',
      status: 'active',
      price: 599.00,
      discount: 0,
      credits_remaining: 6,
      expires_at: new Date(Date.now() + 320 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sub003',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      plan: 'monthly',
      status: 'active',
      price: 299.00,
      discount: 0,
      credits_remaining: 2,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'sub005',
      user_id: '550e8400-e29b-41d4-a716-446655440005',
      plan: 'monthly',
      status: 'active',
      price: 299.00,
      discount: 20,
      credits_remaining: 4,
      employee_id: '550e8400-e29b-41d4-a716-446655440101',
      coupon_code: 'SARAH20',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  letters: [
    {
      id: 'letter001',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Demand Letter for Unpaid Services',
      letter_type: 'Demand Letter',
      status: 'pending_review',
      intake_data: {
        recipient_name: "ABC Corp",
        recipient_address: "123 Business St",
        amount_due: 5000,
        service_date: "2024-10-15",
        description: "Consulting services provided"
      },
      ai_draft_content: `ABC Corp
123 Business St

November 29, 2024

RE: Demand for Payment - Account #12345

Dear ABC Corp,

This letter serves as formal demand for payment of outstanding consulting services in the amount of $5,000.00.

Services were rendered on October 15, 2024, as per our agreement. Despite multiple attempts to collect this debt, the account remains unpaid.

Please remit payment within 10 business days to avoid further action.

Sincerely,
John Doe`,
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'letter002',
      user_id: '550e8400-e29b-41d4-a716-446655440002',
      title: 'Cease and Desist - Copyright Infringement',
      letter_type: 'Cease and Desist',
      status: 'pending_review',
      intake_data: {
        infringing_party: "Copycat Company",
        infringed_work: "Original software code",
        infringement_details: "Unauthorized use of proprietary algorithms",
        first_discovery_date: "2024-11-15"
      },
      ai_draft_content: `Copycat Company
[Address]

November 29, 2024

RE: Cease and Desist Notice - Copyright Infringement

Dear Copycat Company,

We demand that you immediately cease and desist from using our proprietary software code and algorithms.

Your unauthorized use constitutes copyright infringement under applicable law. We discovered this infringement on November 15, 2024.

Failure to comply within 5 business days will result in legal action.

Sincerely,
Jane Smith`,
      created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'letter003',
      user_id: '550e8400-e29b-41d4-a716-446655440003',
      title: 'Landlord-Tenant Dispute - Security Deposit',
      letter_type: 'Legal Notice',
      status: 'under_review',
      intake_data: {
        landlord_name: "Property Management LLC",
        tenant_name: "Robert Johnson",
        property_address: "456 Rental Ave",
        deposit_amount: 1500,
        dispute_reason: "Wrongful withholding of deposit"
      },
      ai_draft_content: `Property Management LLC
[Address]

November 29, 2024

RE: Security Deposit Dispute

Dear Property Management LLC,

I am writing regarding the wrongful withholding of my $1,500.00 security deposit for the property at 456 Rental Ave.

Despite leaving the property in excellent condition, you have failed to return my deposit within the legally required timeframe.

Please remit payment immediately to avoid legal action.

Sincerely,
Robert Johnson`,
      reviewed_by: 'admin@talk-to-my-lawyer.com',
      reviewed_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      review_notes: 'Needs minor clarification on dates',
      created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'letter004',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      title: 'Employment Termination Appeal',
      letter_type: 'Appeal Letter',
      status: 'approved',
      intake_data: {
        employer_name: "Tech Corp Inc",
        employee_name: "John Doe",
        termination_date: "2024-11-01",
        reason_for_appeal: "Wrongful termination",
        previous_warnings: 0
      },
      ai_draft_content: `Tech Corp Inc
[Address]

November 29, 2024

RE: Appeal of Employment Termination

Dear Tech Corp Inc,

I am writing to appeal my recent termination dated November 1, 2024.

This termination was without cause and without any prior warnings or performance issues.

I request an immediate review of this decision.

Sincerely,
John Doe`,
      final_content: `Tech Corp Inc
[Address]

November 29, 2024

RE: Appeal of Employment Termination - FINAL VERSION

To Whom It May Concern:

I am writing to formally appeal my termination dated November 1, 2024, from my position at Tech Corp Inc.

After careful review of my employment record and circumstances surrounding my termination, I believe this action was wrongful and without proper cause. During my employment, I received no written warnings, performance improvement plans, or indications of dissatisfaction with my work.

I respectfully request:
1. Reinstatement to my previous position
2. A full review of the termination circumstances
3. Compensation for lost wages and benefits

I look forward to your prompt response and resolution of this matter.

Sincerely,
John Doe`,
      reviewed_by: 'admin@talk-to-my-lawyer.com',
      reviewed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      review_notes: 'Approved with minor edits to clarify timeline',
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: 'letter005',
      user_id: '550e8400-e29b-41d4-a716-446655440004',
      title: 'Frivolous Legal Threat',
      letter_type: 'Legal Notice',
      status: 'rejected',
      intake_data: {
        target_party: "Business Competitor",
        dispute_type: "Unfair competition",
        damages_sought: 100000,
        legal_basis: "None provided"
      },
      ai_draft_content: `Business Competitor
[Address]

November 29, 2024

RE: Legal Notice

Dear Business Competitor,

This letter constitutes formal notice regarding your unfair competition practices.

We demand $100,000 in damages.

Sincerely,
Emily Wilson`,
      reviewed_by: 'admin@talk-to-my-lawyer.com',
      reviewed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      review_notes: 'Rejected: No valid legal basis provided. This appears to be a frivolous request.',
      rejection_reason: 'No valid legal claim',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  ]
}

async function insertData(table, data) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(data)
  })

  if (!response.ok) {
    console.error(`Error inserting into ${table}:`, await response.text())
    return false
  }

  console.log(`✅ Successfully inserted data into ${table}`)
  return true
}

async function populateDatabase() {
  console.log('🚀 Starting database population...')

  try {
    // Insert profiles
    console.log('\n📝 Inserting profiles...')
    await insertData('profiles', testData.profiles)

    // Insert subscriptions
    console.log('\n💳 Inserting subscriptions...')
    await insertData('subscriptions', testData.subscriptions)

    // Insert letters
    console.log('\n📄 Inserting letters...')
    await insertData('letters', testData.letters)

    console.log('\n🎉 Database population completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- ${testData.profiles.length} profiles created`)
    console.log(`- ${testData.subscriptions.length} subscriptions created`)
    console.log(`- ${testData.letters.length} letters created`)
    console.log('\n✨ Your admin dashboard should now show meaningful data!')

  } catch (error) {
    console.error('❌ Error populating database:', error)
  }
}

// Run the script
populateDatabase()