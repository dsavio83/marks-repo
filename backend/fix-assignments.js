const mongoose = require('mongoose');
require('dotenv').config();

const fixAssignments = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env file');
            process.exit(1);
        }

        console.log('Connecting to database...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected.');

        // Use native collection to bypass Schema validation
        const collection = mongoose.connection.collection('subjectassignments');

        // Count invalid documents (subjectId is empty string or not an ObjectId)
        // Note: In Mongo, ObjectId is a specific type. String is another.
        // We are looking for strings that are empty OR string values that are meant to be ObjectIds but aren't valid?
        // The error was specifically about value "" (empty string).

        const count = await collection.countDocuments({ subjectId: "" });
        console.log(`Found ${count} assignments with empty subjectId.`);

        if (count > 0) {
            const result = await collection.deleteMany({ subjectId: "" });
            console.log(`Successfully deleted ${result.deletedCount} bad assignments.`);
        } else {
            console.log('No bad assignments found (with empty string subjectId).');
        }

        // Also check for null
        const countNull = await collection.countDocuments({ subjectId: null });
        if (countNull > 0) {
            console.log(`Found ${countNull} assignments with null subjectId. Deleting...`);
            await collection.deleteMany({ subjectId: null });
            console.log('Deleted null subjectId assignments.');
        }

        console.log('Done.');
        process.exit(0);

    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
};

fixAssignments();
