const mongoose = require('mongoose');
const ClassRoom = require('./models/ClassRoom');
require('dotenv').config();

async function testClasses() {
    try {
        console.log('Testing Classes...\n');

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB\n');

        const classes = await ClassRoom.find();
        console.log(`Found ${classes.length} classes:\n`);

        classes.forEach(c => {
            console.log(`- ${c.name} (Grade: ${c.gradeLevel}, Section: ${c.section})`);
            console.log(`  ID: ${c._id}`);
            console.log(`  Class Teacher ID: ${c.classTeacherId}`);
            console.log(`  Subjects: ${c.subjects?.length || 0}`);
            console.log('');
        });

        await mongoose.connection.close();
        console.log('Connection closed');

    } catch (error) {
        console.error('Error:', error.message);
        console.error(error);
    }
}

testClasses();
