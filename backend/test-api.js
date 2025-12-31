const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials (use your actual test credentials)
const testCredentials = {
    username: 'admin',
    password: 'admin123'
};

let authToken = '';

async function testAPI() {
    console.log('🧪 Starting API Tests...\n');

    try {
        // Test 1: Health Check
        console.log('1️⃣ Testing Health Endpoint...');
        const healthResponse = await axios.get(`${API_BASE_URL}/health`);
        console.log('✅ Health Check:', healthResponse.data);
        console.log('');

        // Test 2: Login
        console.log('2️⃣ Testing Login...');
        const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, testCredentials);
        authToken = loginResponse.data.token;
        console.log('✅ Login successful');
        console.log('   User:', loginResponse.data.user.name);
        console.log('   Role:', loginResponse.data.user.role);
        console.log('');

        // Set up axios instance with auth
        const api = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });

        // Test 3: Get Profile
        console.log('3️⃣ Testing Get Profile...');
        const profileResponse = await api.get('/auth/profile');
        console.log('✅ Profile retrieved:', profileResponse.data.name);
        console.log('');

        // Test 4: Get All Classes
        console.log('4️⃣ Testing Get All Classes...');
        const classesResponse = await api.get('/classes');
        console.log('✅ Classes retrieved:', classesResponse.data.length, 'classes');
        if (classesResponse.data.length > 0) {
            console.log('   First class:', classesResponse.data[0].name);
        }
        console.log('');

        // Test 5: Get All Subjects
        console.log('5️⃣ Testing Get All Subjects...');
        const subjectsResponse = await api.get('/subjects');
        console.log('✅ Subjects retrieved:', subjectsResponse.data.length, 'subjects');
        console.log('');

        // Test 6: Get All Exams
        console.log('6️⃣ Testing Get All Exams...');
        const examsResponse = await api.get('/exams');
        console.log('✅ Exams retrieved:', examsResponse.data.length, 'exams');
        console.log('');

        // Test 7: Get All Users (Admin only)
        console.log('7️⃣ Testing Get All Users...');
        const usersResponse = await api.get('/users');
        console.log('✅ Users retrieved:', usersResponse.data.length, 'users');
        console.log('');

        // Test 8: Get Marks
        console.log('8️⃣ Testing Get All Marks...');
        const marksResponse = await api.get('/marks');
        console.log('✅ Marks retrieved:', marksResponse.data.length, 'marks');
        console.log('');

        // Test 9: Get School Details
        console.log('9️⃣ Testing Get School Details...');
        const schoolResponse = await api.get('/school');
        console.log('✅ School details retrieved:', schoolResponse.data.name || 'Default');
        console.log('');

        // Test 10: Update School Details
        console.log('🔟 Testing Update School Details...');
        const updateData = {
            name: 'Test Smart School',
            place: 'Test City',
            schoolCode: 'TEST123',
            headMasterName: 'Test Principal',
            address: 'Test Address'
        };
        const updateResponse = await api.put('/school', updateData);
        console.log('✅ School details updated:', updateResponse.data.name);
        console.log('');

        console.log('🎉 All API tests passed!\n');
        console.log('Summary:');
        console.log('✅ Health check working');
        console.log('✅ Authentication working');
        console.log('✅ All resource endpoints accessible');
        console.log('✅ MongoDB connection working');
        console.log('✅ Authorization working');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

// Run tests
testAPI();
