/**
 * Security & Vulnerability Verification Audit Suite for Fitnex Backend
 */
const http = require('http');

console.log('================================================================');
console.log('       FITNEX DEFENSIVE SECURITY & VULNERABILITY AUDIT SUITE     ');
console.log('================================================================\n');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        let parsed = null;
        try {
          parsed = JSON.parse(body);
        } catch {
          parsed = body;
        }
        resolve({ status: res.statusCode, headers: res.headers, body: parsed });
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

let passed = 0;
let total = 0;

async function check(desc, fn) {
  total++;
  try {
    await fn();
    console.log(`  ✅ [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${desc}`);
    console.error(`     Error: ${err.message}`);
  }
}

async function runAudit() {
  let authToken = '';

  // 1. Athlete login for token
  await check('Authenticate athlete to obtain JWT token', async () => {
    const res = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: 'athlete@fitnex.com', password: 'Password123!' }
    );
    if (res.status !== 200 || !res.body?.data?.accessToken) {
      throw new Error(`Login failed with status ${res.status}`);
    }
    authToken = res.body.data.accessToken;
  });

  // 2. ReDoS & Regex Injection Resistance Test
  await check('Exercises search: resist special regex character attacks without 500 crash', async () => {
    const attacks = ['(', '[', '*', '+', '?', '([a-z]+)+$', '\\'];
    for (const term of attacks) {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/exercises?search=${encodeURIComponent(term)}&limit=5`,
        method: 'GET',
      });
      if (res.status !== 200) {
        throw new Error(`Search for regex term "${term}" crashed with status ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }
  });

  // 3. Nutrition search: resist special regex character attacks without 500 crash
  await check('Nutrition search: resist special regex character attacks without 500 crash', async () => {
    const attacks = ['(', '[', '*', '+', '?', '\\'];
    for (const term of attacks) {
      const res = await request({
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1/meals?search=${encodeURIComponent(term)}&limit=5`,
        method: 'GET',
      });
      if (res.status !== 200) {
        throw new Error(`Nutrition search for term "${term}" crashed with status ${res.status}: ${JSON.stringify(res.body)}`);
      }
    }
  });

  // 4. Invalid ObjectId CastError handling (must return 400 or 404, never 500)
  await check('Invalid ObjectId format in /exercises/:id returns 404 (not 500 crash)', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/exercises/invalid-id-not-a-mongo-hex',
      method: 'GET',
    });
    if (res.status === 500) {
      throw new Error(`Returned 500 Internal Server Error instead of 404`);
    }
    if (res.status !== 404) {
      throw new Error(`Expected status 404, got ${res.status}`);
    }
  });

  // 5. Invalid ObjectId format in /plans/:id returns 404 (not 500 crash)
  await check('Invalid ObjectId format in /plans/:id returns 404 (not 500 crash)', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/plans/invalid-plan-format-123',
      method: 'GET',
    });
    if (res.status === 500) {
      throw new Error(`Returned 500 Internal Server Error instead of 404`);
    }
    if (res.status !== 404) {
      throw new Error(`Expected status 404, got ${res.status}`);
    }
  });

  // 6. Privilege escalation prevention: role cannot be altered via profile update
  await check('Privilege escalation: forbids injecting role or admin privileges', async () => {
    const res = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/users/me/profile',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
      { role: 'admin', isEmailVerified: true }
    );
    if (res.status !== 400) {
      throw new Error(`Expected 400 Bad Request for non-whitelisted fields, got ${res.status}`);
    }
  });

  // 7. Legitimate profile update succeeds cleanly
  await check('Whitelisted profile settings update succeeds', async () => {
    const res = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/v1/users/me/profile',
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
      },
      { weightUnit: 'kg', heightUnit: 'cm', theme: 'dark', profile: { goal: 'muscle' } }
    );
    if (res.status !== 200) {
      throw new Error(`Expected 200 OK, got ${res.status}: ${JSON.stringify(res.body)}`);
    }
  });

  // 8. IDOR Prevention: cannot delete meal log of another user or invalid log ID
  await check('IDOR check: invalid or foreign meal log deletion returns 404', async () => {
    const res = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/v1/meals/logs/507f1f77bcf86cd799439011',
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    if (res.status !== 404) {
      throw new Error(`Expected 404 NotFound on foreign meal log, got ${res.status}`);
    }
  });

  console.log('\n================================================================');
  console.log(`   SECURITY AUDIT RESULTS: ${passed}/${total} PASSED`);
  console.log('================================================================');

  if (passed !== total) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit fatal error:', err);
  process.exit(1);
});
