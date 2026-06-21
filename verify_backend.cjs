const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

const BASE_URL = 'http://localhost:5000/api';

async function runVerification() {
    console.log('Starting Backend Verification...');

    // 1. Health Check
    try {
        const res = await axios.get('http://localhost:5000/');
        console.log('✅ Health Check Passed:', res.data);
    } catch (e) {
        console.error('❌ Health Check Failed:', e.message);
        return;
    }

    let trackingId;
    let adminToken;

    // 2. Create Application
    try {
        const form = new FormData();
        form.append('serviceName', 'New PAN Card');
        form.append('serviceId', 'pan-001');
        form.append('userDetails', JSON.stringify({
            fullName: 'Test User',
            mobile: '9876543210',
            email: 'test@example.com',
            address: '123 Test St',
            city: 'Test City',
            state: 'Test State',
            pincode: '110083'
        }));
        form.append('paymentDetails', JSON.stringify({
            amount: 150,
            transactionId: 'TXN_' + Date.now(),
            paymentStatus: 'Paid',
            paymentDate: new Date()
        }));

        // Append a dummy file
        if (fs.existsSync('dummy.pdf')) {
            form.append('documents', fs.createReadStream('dummy.pdf'));
        } else {
            console.warn('⚠️ dummy.pdf not found, skipping file attachment');
        }

        const res = await axios.post(`${BASE_URL}/applications`, form, {
            headers: form.getHeaders()
        });

        if (res.data.success) {
            console.log('✅ Create Application Passed');
            trackingId = res.data.data.trackingId;
            console.log('   Tracking ID:', trackingId);
        } else {
            console.error('❌ Create Application Failed:', res.data);
        }

    } catch (e) {
        console.error('❌ Create Application Error:', e.message, e.response?.data);
    }

    // 3. Track Application
    if (trackingId) {
        try {
            const res = await axios.get(`${BASE_URL}/applications/track/${trackingId}`);
            if (res.data.success && res.data.data.trackingId === trackingId) {
                console.log('✅ Track Application Passed');
                console.log('   Status:', res.data.data.status);
            } else {
                console.error('❌ Track Application Failed');
            }
        } catch (e) {
            console.error('❌ Track Application Error:', e.message);
        }
    }

    // 4. Admin Register & Login
    try {
        // Try registering (might fail if exists, which is fine)
        try {
            await axios.post(`${BASE_URL}/admin/register`, {
                email: 'admin@test.com',
                password: 'password123'
            });
            console.log('ℹ️  Admin Registered');
        } catch (e) {
            if (e.response?.status === 400) console.log('ℹ️  Admin already exists');
            else console.error('⚠️ Admin Register Error:', e.message);
        }

        const loginRes = await axios.post(`${BASE_URL}/admin/login`, {
            email: 'admin@test.com',
            password: 'password123'
        });

        if (loginRes.data.token) {
            console.log('✅ Admin Login Passed');
            adminToken = loginRes.data.token;
        } else {
            console.error('❌ Admin Login Failed');
        }

    } catch (e) {
        console.error('❌ Admin Auth Error:', e.message);
    }

    // 5. Admin Get Applications
    if (adminToken) {
        try {
            const res = await axios.get(`${BASE_URL}/applications`, {
                headers: { Authorization: `Bearer ${adminToken}` }
            });
            if (res.data.success && Array.isArray(res.data.data)) {
                console.log('✅ Admin Get Applications Passed');
                console.log(`   Found ${res.data.data.length} applications`);

                // Verify our created app is in the list
                const found = res.data.data.find(a => a.trackingId === trackingId);
                if (found) console.log('✅ Verified created app is visible to admin');
                else console.error('❌ Created app NOT found in admin list');

            } else {
                console.error('❌ Admin Get Applications Failed');
            }
        } catch (e) {
            console.error('❌ Admin Get Applications Error:', e.message);
        }
    }

    console.log('Verification Complete.');
}

runVerification();
