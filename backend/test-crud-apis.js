const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test credentials - using admin account
const adminCredentials = {
    username: 'admin',
    password: 'admin123'
};

let authToken = '';

// Helper function to make authenticated requests
const makeRequest = async (method, endpoint, data = null) => {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            config.data = data;
        }

        const response = await axios(config);
        return { success: true, data: response.data };
    } catch (error) {
        return {
            success: false,
            error: error.response?.data?.message || error.message,
            status: error.response?.status
        };
    }
};

// Test authentication
async function testAuth() {
    console.log('\n=== Testing Authentication ===');
    try {
        const response = await axios.post(`${API_URL}/auth/login`, adminCredentials);
        authToken = response.data.token;
        console.log('✓ Login successful');
        console.log('  Token:', authToken.substring(0, 20) + '...');
        return true;
    } catch (error) {
        console.log('✗ Login failed:', error.response?.data?.message || error.message);
        return false;
    }
}

// Test Classes API
async function testClassesAPI() {
    console.log('\n=== Testing Classes API ===');

    // GET all classes
    const getAll = await makeRequest('GET', '/classes');
    console.log('GET /classes:', getAll.success ? '✓' : '✗', getAll.success ? `(${getAll.data.length} classes)` : getAll.error);

    if (!getAll.success || getAll.data.length === 0) {
        console.log('  Skipping update/delete tests (no classes found)');
        return;
    }

    const testClass = getAll.data[0];

    // UPDATE class
    const update = await makeRequest('PUT', `/classes?id=${testClass._id}`, {
        name: testClass.name,
        description: 'Updated via API test'
    });
    console.log('PUT /classes:', update.success ? '✓' : '✗', update.error || 'Updated successfully');
}

// Test Subjects API
async function testSubjectsAPI() {
    console.log('\n=== Testing Subjects API ===');

    const getAll = await makeRequest('GET', '/subjects');
    console.log('GET /subjects:', getAll.success ? '✓' : '✗', getAll.success ? `(${getAll.data.length} subjects)` : getAll.error);

    if (!getAll.success || getAll.data.length === 0) {
        console.log('  Skipping update/delete tests (no subjects found)');
        return;
    }

    const testSubject = getAll.data[0];

    const update = await makeRequest('PUT', `/subjects?id=${testSubject._id}`, {
        name: testSubject.name,
        code: testSubject.code
    });
    console.log('PUT /subjects:', update.success ? '✓' : '✗', update.error || 'Updated successfully');
}

// Test Users API
async function testUsersAPI() {
    console.log('\n=== Testing Users/Teachers API ===');

    const getAll = await makeRequest('GET', '/users');
    console.log('GET /users:', getAll.success ? '✓' : '✗', getAll.success ? `(${getAll.data.length} users)` : getAll.error);

    if (!getAll.success || getAll.data.length === 0) {
        console.log('  Skipping update tests (no users found)');
        return;
    }

    // Find a teacher to update (not admin)
    const testUser = getAll.data.find(u => u.role === 'TEACHER') || getAll.data[1];

    if (testUser) {
        const update = await makeRequest('PUT', `/users?id=${testUser._id}`, {
            name: testUser.name,
            email: testUser.email
        });
        console.log('PUT /users:', update.success ? '✓' : '✗', update.error || 'Updated successfully');
    }
}

// Test Exams API
async function testExamsAPI() {
    console.log('\n=== Testing Exams API ===');

    const getAll = await makeRequest('GET', '/exams');
    console.log('GET /exams:', getAll.success ? '✓' : '✗', getAll.success ? `(${getAll.data.length} exams)` : getAll.error);

    if (!getAll.success || getAll.data.length === 0) {
        console.log('  Skipping update tests (no exams found)');
        return;
    }

    const testExam = getAll.data[0];

    const update = await makeRequest('PUT', `/exams?id=${testExam._id}`, {
        name: testExam.name,
        classId: testExam.classId,
        date: testExam.date,
        totalMarks: testExam.totalMarks
    });
    console.log('PUT /exams:', update.success ? '✓' : '✗', update.error || 'Updated successfully');
}

// Test Marks API
async function testMarksAPI() {
    console.log('\n=== Testing Marks API ===');

    const getAll = await makeRequest('GET', '/marks');
    console.log('GET /marks:', getAll.success ? '✓' : '✗', getAll.success ? `(${getAll.data.length} marks)` : getAll.error);

    if (!getAll.success || getAll.data.length === 0) {
        console.log('  Skipping update tests (no marks found)');
        return;
    }

    const testMark = getAll.data[0];

    const update = await makeRequest('PUT', `/marks?id=${testMark._id}`, {
        studentId: testMark.studentId,
        examId: testMark.examId,
        marksObtained: testMark.marksObtained
    });
    console.log('PUT /marks:', update.success ? '✓' : '✗', update.error || 'Updated successfully');
}

// Test Grades API
async function testGradesAPI() {
    console.log('\n=== Testing Grades API ===');

    const getAll = await makeRequest('GET', '/grades');
    console.log('GET /grades:', getAll.success ? '✓' : '✗', getAll.success ? `(${getAll.data.length} grade schemes)` : getAll.error);

    // Try to create a test grade scheme
    const create = await makeRequest('POST', '/grades', {
        name: 'Test Grade Scheme',
        applicableClasses: ['Class 10'],
        boundaries: [
            { grade: 'A+', minPercent: 90 },
            { grade: 'A', minPercent: 80 },
            { grade: 'B+', minPercent: 70 },
            { grade: 'B', minPercent: 60 },
            { grade: 'C', minPercent: 50 }
        ]
    });
    console.log('POST /grades:', create.success ? '✓' : '✗', create.error || 'Created successfully');

    if (create.success) {
        const createdId = create.data._id;

        // Update the created grade scheme
        const update = await makeRequest('PUT', `/grades?id=${createdId}`, {
            name: 'Updated Test Grade Scheme',
            applicableClasses: ['Class 10', 'Class 11'],
            boundaries: create.data.boundaries
        });
        console.log('PUT /grades:', update.success ? '✓' : '✗', update.error || 'Updated successfully');

        // Delete the test grade scheme
        const deleteResult = await makeRequest('DELETE', `/grades?id=${createdId}`);
        console.log('DELETE /grades:', deleteResult.success ? '✓' : '✗', deleteResult.error || 'Deleted successfully');
    }
}

// Run all tests
async function runTests() {
    console.log('Starting API Tests...');
    console.log('='.repeat(50));

    const authSuccess = await testAuth();

    if (!authSuccess) {
        console.log('\n✗ Authentication failed. Cannot proceed with tests.');
        return;
    }

    await testClassesAPI();
    await testSubjectsAPI();
    await testUsersAPI();
    await testExamsAPI();
    await testMarksAPI();
    await testGradesAPI();

    console.log('\n' + '='.repeat(50));
    console.log('Tests completed!');
}

runTests();
