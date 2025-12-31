const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const ClassRoom = require('./models/ClassRoom');
const Subject = require('./models/Subject');
const SubjectAssignment = require('./models/SubjectAssignment');
const SchoolDetails = require('./models/SchoolDetails');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await ClassRoom.deleteMany({});
    await Subject.deleteMany({});
    await SubjectAssignment.deleteMany({});
    await SchoolDetails.deleteMany({});
    
    console.log('✓ Cleared existing data');

    // Create School Details
    const schoolDetails = new SchoolDetails({
      name: 'Smart School',
      place: 'Chennai',
      schoolCode: 'SCH001',
      headMasterName: 'Principal',
      address: '123 Education Street, Chennai'
    });
    await schoolDetails.save();
    console.log('✓ Created school details');

    // Create Subjects
    const subjects = [
      { name: 'English', shortCode: 'ENG' },
      { name: 'Mathematics', shortCode: 'MAT' },
      { name: 'Science', shortCode: 'SCI' },
      { name: 'Social Science', shortCode: 'SOC' },
      { name: 'Tamil', shortCode: 'TAM' },
      { name: 'Hindi', shortCode: 'HIN' },
      { name: 'Physical Education', shortCode: 'PE' },
      { name: 'Computer Science', shortCode: 'CS' }
    ];

    const createdSubjects = [];
    for (const subjectData of subjects) {
      const subject = new Subject(subjectData);
      await subject.save();
      createdSubjects.push(subject);
      console.log(`✓ Created subject: ${subject.name}`);
    }

    // Create Users first (so we have teacher IDs)
    const users = [
      // Admin
      {
        username: 'admin',
        name: 'Admin User',
        role: 'ADMIN',
        password: 'admin123',
        mobile: '1234567890',
        email: 'admin@smartschool.com',
        gender: 'Male',
        dob: '1980-01-01',
        category: 'General',
        caste: 'General',
        religion: 'Hindu',
        fatherName: 'Father Admin',
        motherName: 'Mother Admin',
        address: 'Admin Address',
        transportMode: 'Car'
      },
      
      // Teachers
      {
        username: 'teacher1',
        name: 'John Teacher',
        role: 'TEACHER',
        password: 'teacher123',
        mobile: '9876543210',
        email: 'john@smartschool.com',
        gender: 'Male',
        dob: '1985-05-15',
        category: 'General',
        caste: 'General',
        religion: 'Christian',
        fatherName: 'Father John',
        motherName: 'Mother John',
        address: 'Teacher Address 1',
        transportMode: 'Car'
      },
      {
        username: 'teacher2',
        name: 'Jane Teacher',
        role: 'TEACHER',
        password: 'teacher456',
        mobile: '8765432109',
        email: 'jane@smartschool.com',
        gender: 'Female',
        dob: '1988-08-20',
        category: 'OBC',
        caste: 'OBC',
        religion: 'Muslim',
        fatherName: 'Father Jane',
        motherName: 'Mother Jane',
        address: 'Teacher Address 2',
        transportMode: 'School Bus'
      },
      {
        username: 'teacher3',
        name: 'Bob Teacher',
        role: 'TEACHER',
        password: 'teacher789',
        mobile: '7654321098',
        email: 'bob@smartschool.com',
        gender: 'Male',
        dob: '1975-12-10',
        category: 'SC',
        caste: 'SC',
        religion: 'Hindu',
        fatherName: 'Father Bob',
        motherName: 'Mother Bob',
        address: 'Teacher Address 3',
        transportMode: 'Two Wheeler'
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      console.log(`✓ Created user: ${user.name} (${user.role})`);
    }

    // Create Classes with class teachers
    const classes = [
      { name: '6-A', section: 'A', gradeLevel: '6', classTeacherId: createdUsers[1]._id }, // John Teacher
      { name: '7-B', section: 'B', gradeLevel: '7', classTeacherId: createdUsers[2]._id }, // Jane Teacher
      { name: '8-C', section: 'C', gradeLevel: '8', classTeacherId: createdUsers[3]._id }, // Bob Teacher
      { name: '9-D', section: 'D', gradeLevel: '9', classTeacherId: createdUsers[1]._id }, // John Teacher
      { name: '10-E', section: 'E', gradeLevel: '10', classTeacherId: createdUsers[2]._id }  // Jane Teacher
    ];

    const createdClasses = [];
    for (const classData of classes) {
      const classRoom = new ClassRoom(classData);
      await classRoom.save();
      createdClasses.push(classRoom);
      console.log(`✓ Created class: ${classRoom.name}`);
    }

    // Create Students
    const students = [
      {
        username: 'student1',
        name: 'Alice Student',
        role: 'STUDENT',
        admissionNo: 'ADM001',
        mobile: '9988776655',
        email: 'alice@student.com',
        gender: 'Female',
        dob: '2010-03-15',
        category: 'General',
        caste: 'General',
        religion: 'Hindu',
        fatherName: 'Father Alice',
        motherName: 'Mother Alice',
        address: 'Student Address 1',
        transportMode: 'School Bus',
        classId: createdClasses[0]._id
      },
      {
        username: 'student2',
        name: 'Bob Student',
        role: 'STUDENT',
        admissionNo: 'ADM002',
        mobile: '8877665544',
        email: 'bob@student.com',
        gender: 'Male',
        dob: '2011-07-22',
        category: 'OBC',
        caste: 'OBC',
        religion: 'Christian',
        fatherName: 'Father Bob',
        motherName: 'Mother Bob',
        address: 'Student Address 2',
        transportMode: 'Car',
        classId: createdClasses[0]._id
      },
      {
        username: 'student3',
        name: 'Charlie Student',
        role: 'STUDENT',
        admissionNo: 'ADM003',
        mobile: '7766554433',
        email: 'charlie@student.com',
        gender: 'Male',
        dob: '2010-11-05',
        category: 'SC',
        caste: 'SC',
        religion: 'Muslim',
        fatherName: 'Father Charlie',
        motherName: 'Mother Charlie',
        address: 'Student Address 3',
        transportMode: 'By Walk',
        classId: createdClasses[1]._id
      },
      {
        username: 'student4',
        name: 'Diana Student',
        role: 'STUDENT',
        admissionNo: 'ADM004',
        mobile: '6655443322',
        email: 'diana@student.com',
        gender: 'Female',
        dob: '2012-02-14',
        category: 'ST',
        caste: 'ST',
        religion: 'Hindu',
        fatherName: 'Father Diana',
        motherName: 'Mother Diana',
        address: 'Student Address 4',
        transportMode: 'Auto',
        classId: createdClasses[1]._id
      },
      {
        username: 'student5',
        name: 'Eve Student',
        role: 'STUDENT',
        admissionNo: 'ADM005',
        mobile: '5544332211',
        email: 'eve@student.com',
        gender: 'Female',
        dob: '2010-09-30',
        category: 'General',
        caste: 'General',
        religion: 'Christian',
        fatherName: 'Father Eve',
        motherName: 'Mother Eve',
        address: 'Student Address 5',
        transportMode: 'Jeep',
        classId: createdClasses[2]._id
      }
    ];

    for (const studentData of students) {
      const student = new User(studentData);
      await student.save();
      createdUsers.push(student);
      console.log(`✓ Created user: ${student.name} (${student.role})`);
    }

    // Create Subject Assignments
    const assignments = [
      // Class 6-A
      { classId: createdClasses[0]._id, subjectId: createdSubjects[0]._id, teacherId: createdUsers[1]._id }, // English - John
      { classId: createdClasses[0]._id, subjectId: createdSubjects[1]._id, teacherId: createdUsers[2]._id }, // Math - Jane
      { classId: createdClasses[0]._id, subjectId: createdSubjects[2]._id, teacherId: createdUsers[3]._id }, // Science - Bob
      
      // Class 7-B
      { classId: createdClasses[1]._id, subjectId: createdSubjects[3]._id, teacherId: createdUsers[1]._id }, // Social - John
      { classId: createdClasses[1]._id, subjectId: createdSubjects[4]._id, teacherId: createdUsers[2]._id }, // Tamil - Jane
      { classId: createdClasses[1]._id, subjectId: createdSubjects[5]._id, teacherId: createdUsers[3]._id }, // Hindi - Bob
      
      // Class 8-C
      { classId: createdClasses[2]._id, subjectId: createdSubjects[6]._id, teacherId: createdUsers[1]._id }, // PE - John
      { classId: createdClasses[2]._id, subjectId: createdSubjects[7]._id, teacherId: createdUsers[2]._id }, // CS - Jane
      { classId: createdClasses[2]._id, subjectId: createdSubjects[0]._id, teacherId: createdUsers[3]._id }, // English - Bob
    ];

    for (const assignmentData of assignments) {
      const assignment = new SubjectAssignment(assignmentData);
      await assignment.save();
      console.log(`✓ Created assignment: Class ${createdClasses.find(c => c._id.equals(assignmentData.classId))?.name} - ${createdSubjects.find(s => s._id.equals(assignmentData.subjectId))?.name}`);
    }

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('Admin: username: admin, password: admin123');
    console.log('Teacher 1: username: teacher1, password: teacher123');
    console.log('Teacher 2: username: teacher2, password: teacher456');
    console.log('Teacher 3: username: teacher3, password: teacher789');
    console.log('Student 1: username: student1, password: 9988776655 (mobile)');
    console.log('Student 2: username: student2, password: 8877665544 (mobile)');
    console.log('Student 3: username: student3, password: 7766554433 (mobile)');
    console.log('Student 4: username: student4, password: 6655443322 (mobile)');
    console.log('Student 5: username: student5, password: 5544332211 (mobile)');

  } catch (error) {
    console.error('✗ Error seeding database:', error);
    process.exit(1);
  } finally {
    mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
};

// Run the seeding
connectDB().then(() => {
  seedDatabase();
});