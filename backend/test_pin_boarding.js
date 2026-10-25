const http = require('http');

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runTests() {
  console.log('=== TEST SUITE: BOARD BUS USING PIN & QR INTEGRITY ===');
  let passed = 0;
  let total = 0;

  function assert(condition, desc) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
    }
  }

  try {
    // 1. Login as Student
    const loginRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      identifier: '25KN1A12C2',
      password: 'Password@123'
    });

    assert(loginRes.status === 200 && loginRes.data.success, 'Student login succeeds with 25KN1A12C2');
    const token = loginRes.data.token;
    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Fetch vehicles & verify boardingPin
    const vehRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/vehicles',
      method: 'GET',
      headers: authHeaders
    });
    const vehiclesList = vehRes.data.vehicles || (Array.isArray(vehRes.data) ? vehRes.data : []);
    const bus31 = vehiclesList.find(v => v.busNumber === 'Bus 31');
    assert(bus31 && bus31.boardingPin === '3101', 'Bus 31 includes boardingPin: 3101');

    // 3. Reset boarding first so clean state
    await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/boarding/reset',
      method: 'POST',
      headers: authHeaders
    }, {});

    // 4. Test missing PIN
    const missingPinRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/boarding/confirm',
      method: 'POST',
      headers: authHeaders
    }, {
      busNumber: 'Bus 31',
      method: 'PIN',
      pin: ''
    });
    assert(missingPinRes.status === 400 && missingPinRes.data.error.includes('PIN Required'), 'Missing PIN rejected with 400 and clear message');

    // 5. Test invalid PIN
    const invalidPinRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/boarding/confirm',
      method: 'POST',
      headers: authHeaders
    }, {
      busNumber: 'Bus 31',
      method: 'PIN',
      pin: '9999'
    });
    assert(invalidPinRes.status === 400 && invalidPinRes.data.error.includes('Incorrect Boarding PIN'), 'Incorrect PIN (9999) rejected with 400');

    // 6. Test valid PIN 3101 for Bus 31
    const initialOccupancy = bus31.currentOccupancy;
    const validPinRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/boarding/confirm',
      method: 'POST',
      headers: authHeaders
    }, {
      busNumber: 'Bus 31',
      method: 'PIN',
      pin: '3101'
    });
    assert(validPinRes.status === 201 && validPinRes.data.success, 'Valid PIN (3101) confirms boarding with 201 Created');
    assert(validPinRes.data.record.method === 'PIN', 'Boarding record method is recorded as PIN');
    assert(validPinRes.data.newPassengerCount === initialOccupancy + 1, `Passenger count incremented by 1 (from ${initialOccupancy} to ${validPinRes.data.newPassengerCount})`);

    // 7. Duplicate boarding attempt
    const duplicateRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/boarding/confirm',
      method: 'POST',
      headers: authHeaders
    }, {
      busNumber: 'Bus 31',
      method: 'PIN',
      pin: '3101'
    });
    assert(duplicateRes.status === 409 && duplicateRes.data.error.includes('Duplicate Boarding Blocked'), 'Duplicate boarding blocked with 409 Conflict');

    // 8. Boarding status query
    const statusRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/boarding/status',
      method: 'GET',
      headers: authHeaders
    });
    assert(statusRes.status === 200 && statusRes.data.hasBoarded === true, 'Boarding status returns hasBoarded: true');

    // 9. Reset boarding
    const resetRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/boarding/reset',
      method: 'POST',
      headers: authHeaders
    }, {});
    assert(resetRes.status === 200 && resetRes.data.success, 'Reset boarding returns success');

    // 10. Verify classroom attendance QR sessions are preserved
    const sessionsRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: '/api/attendance/sessions',
      method: 'GET',
      headers: authHeaders
    });
    assert(sessionsRes.status === 200 && (Array.isArray(sessionsRes.data) || Array.isArray(sessionsRes.data.sessions)), 'Classroom attendance sessions endpoint is active & preserved');

    console.log(`\nResults: ${passed}/${total} assertions passed.`);
    if (passed === total) {
      console.log('ALL TESTS PASSED!');
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

runTests();
