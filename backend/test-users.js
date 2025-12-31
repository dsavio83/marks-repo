const mongoose = require('mongoose');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

async function testUserQueries() {
    let output = '';
    const log = (msg) => {
        console.log(msg);
        output += msg + '\n';
    };

    try {
        log('Testing MongoDB User Queries...\n');

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        log('Connected to MongoDB\n');

        // Test 1: Get all users
        log('1. Getting all users...');
        const allUsers = await User.find();
        log(`   Found ${allUsers.length} total users`);

        // Show breakdown by role
        const roleBreakdown = allUsers.reduce((acc, user) => {
            acc[user.role] = (acc[user.role] || 0) + 1;
            return acc;
        }, {});
        log('   Role breakdown: ' + JSON.stringify(roleBreakdown, null, 2));
        log('');

        // Test 2: Get teachers specifically
        log('2. Getting teachers (role: TEACHER)...');
        const teachers = await User.find({ role: 'TEACHER' });
        log(`   Found ${teachers.length} teachers`);
        if (teachers.length > 0) {
            log('   Teachers:');
            teachers.forEach(t => {
                log(`   - ${t.name} (${t.username}) - ID: ${t._id}`);
            });
        } else {
            log('   WARNING: No teachers found in database!');
        }
        log('');

        // Test 3: Get students
        log('3. Getting students (role: STUDENT)...');
        const students = await User.find({ role: 'STUDENT' });
        log(`   Found ${students.length} students`);
        log('');

        // Test 4: Get admins
        log('4. Getting admins (role: ADMIN)...');
        const admins = await User.find({ role: 'ADMIN' });
        log(`   Found ${admins.length} admins`);
        if (admins.length > 0) {
            log('   Admins:');
            admins.forEach(a => {
                log(`   - ${a.name} (${a.username})`);
            });
        }
        log('');

        // Test 5: Show all users with their roles
        log('5. All users in database:');
        allUsers.forEach(u => {
            log(`   - ${u.name} (${u.username}) - Role: ${u.role}`);
        });
        log('');

        log('All tests completed!');

        // Write to file
        fs.writeFileSync('test-users-output.txt', output);
        log('Output written to test-users-output.txt');

        await mongoose.connection.close();
        log('Connection closed');

    } catch (error) {
        log('Error: ' + error.message);
        console.error(error);
        fs.writeFileSync('test-users-output.txt', output + '\n\nERROR:\n' + error.stack);
    }
}

testUserQueries();
