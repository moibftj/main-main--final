const https = require('https');

// Configuration
const ACCESS_TOKEN = 'sbp_f68a433be9db029bfe87ba6f9e86da4d71829479';
const PROJECT_REF = 'nomiiqzxaxyxnxndvkbe';

console.log('🔒 Enabling Leaked Password Protection...\n');

// Function to make API request
function makeRequest(path, method, data = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;

    const options = {
      hostname: 'api.supabase.com',
      port: 443,
      path: path,
      method: method,
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        ...(postData && { 'Content-Length': Buffer.byteLength(postData) })
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// Enable leaked password protection
async function enableLeakedPasswordProtection() {
  try {
    console.log('📋 Checking current auth configuration...\n');

    // Get current auth config
    const configResponse = await makeRequest(`/v1/projects/${PROJECT_REF}/config/auth`, 'GET');

    if (configResponse.status === 200) {
      const config = configResponse.data;
      console.log('Current Auth Configuration:');
      console.log(`  Site URL: ${config.site_url}`);
      console.log(`  External Providers: ${Object.keys(config.external || {}).join(', ') || 'None'}`);

      // Check if password protection settings exist
      if (config.security) {
        console.log(`  Password Protection: ${JSON.stringify(config.security, null, 2)}`);
      }
    }

    console.log('\n🔧 Attempting to enable leaked password protection...');

    // Update auth config to enable password protection
    const updatePayload = {
      site_url: 'https://www.talk-to-my-lawyer.com',
      jwt_secret: null, // Keep existing
      db_url: null, // Keep existing
      external: null, // Keep existing
      smtp: null, // Keep existing
      auth: {
        password_min_length: 8,
        password_required: true,
        user_label: null,
        site_name: 'Talk-To-My-Lawyer',
        additional_scopes: null,
        saml_enabled: false,
        enable_signup: true,
        enable_manual_linking: false,
        security: {
          breached_passwords: {
            enabled: true,
            action: 'block' // or 'warn' if you prefer
          }
        }
      }
    };

    const updateResponse = await makeRequest(`/v1/projects/${PROJECT_REF}/config/auth`, 'PUT', updatePayload);

    if (updateResponse.status === 200) {
      console.log('✅ Leaked password protection has been enabled!');
      console.log('\n📝 Configuration applied:');
      console.log('  • breached_passwords.enabled: true');
      console.log('  • breached_passwords.action: block');
      console.log('\nThis will:');
      console.log('  • Check passwords against known breached password lists');
      console.log('  • Block users from setting compromised passwords');
      console.log('  • Enhance overall account security');
    } else {
      console.log(`⚠️  Update status: ${updateResponse.status}`);
      console.log('Response:', JSON.stringify(updateResponse.data, null, 2));
    }

    console.log('\n💡 Note: Changes may take a few minutes to propagate.');
    console.log('💡 You can verify this in the Supabase Dashboard under Authentication > Security');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Alternative: Enable manually in Supabase Dashboard:');
    console.log('   1. Go to: https://app.supabase.com/project/' + PROJECT_REF + '/auth/security');
    console.log('   2. Enable "Enable breached password detection"');
    console.log('   3. Set action to "Block"');
  }
}

// Run the fix
enableLeakedPasswordProtection();