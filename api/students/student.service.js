const moment = require('moment');
const db = require('../_helpers/db');
const utils = require('../_helpers/utils');
const { ObjectID } = require('mongodb');

module.exports = {
    createStudent,
    updateStudent,
    getAllStudents,
    searchStudents,
    deepSearchStudents,
    getStudentById,
    deleteStudent: _deleteStudent,
    addStudentFormData,
    updateStudentFormData
}

async function createStudent(studentData, user) {
    console.log('entered studentService.createStudent');
    const loggedInUser = await db.User.findById(user.id);
    const student = new db.Student(studentData);
    student.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await student.save();
}

async function updateStudent(id, data, user) {
    console.log(`entered studentService.updateStudent ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const student = await getStudent(id);

    // copy data to student and save
    data.tracking = student.tracking;
    data.tracking.lastUpdatedDate = moment().toISOString();
    data.tracking.lastUpdatedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    Object.assign(student, data);
    await student.save();

    return student;
}

async function addStudentFormData(StudentForm, user) {
    console.log('entered studentService.addStudentFormData');
    const loggedInUser = await db.User.findById(user.id);
    const student = new db.StudentFormData(StudentForm);
    student.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await student.save();
}

async function updateStudentFormData(id, data, user) {
    console.log(`entered studentService.updateStudentFormData ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const studentFormData = await db.StudentFormData.findById(id);

    // copy data to student and save
    data.tracking = studentFormData.tracking;
    data.tracking.lastUpdatedDate = moment().toISOString();
    data.tracking.lastUpdatedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    Object.assign(studentFormData, data);
    await studentFormData.save();

    return studentFormData;
}

async function _deleteStudent(id, user) {
    console.log(`entered studentService._deleteStudent ${id}`);
    const loggedInUser = await db.User.findById(user.id);
    const student = await getStudent(id);
    student.tracking.deletedDate = moment().toISOString();
    student.tracking.deletedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    student.markedAsDeleted = true;
    return await this.updateStudent(id, student, user);
}

async function getAllStudents(loggedInUser, university, queryData) {
    console.log('entered studentService.getAllStudents');
    const query = { active: true, university };
    
    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    } else {
        query["courses.assignedMentors"] = {$in: [loggedInUser.id]};
    }
    console.log("gettudents with query", query);
    return await db.Student.find(query);
}

async function deepSearchStudents(query, loggedInUser) {
    const match = {active: true};
    // Search query
    if (query.term && query.term !== 'all') {
        match['populatedCourses.term'] = ObjectID(query.term);
    }
    if (query.professor && query.professor !== 'all') {
        match['populatedCourses.professor'] = ObjectID(query.professor);
    }
    if (query.course && query.course !== 'all') {
        match['populatedCourses._id'] = ObjectID(query.course);
    }
    if (query.termPeriod && query.termPeriod !== 'all') {
        match['populatedCourses.termPeriod.type'] = query.termPeriod;
    }
    if (query.university && query.university !== 'all') {
        match['university'] = ObjectID(query.university);
    }

    if(utils.isAdministrator(loggedInUser.role)) {
        delete match.active;
    } else {
        // Include the query for assignedMentors
        if (loggedInUser) {
            match['courses.assignedMentors'] = {$in: [ObjectID(loggedInUser.id)]};
        }
    }
    console.log("match query pipeline", match);
    

    return db.Student.aggregate([
        // Lookup to populate the courses field
        {
            $lookup: {
                from: 'courses', // Collection name of courses
                localField: 'courses.course', // Field in student schema
                foreignField: '_id', // Field in courses schema
                as: 'populatedCourses' // Alias for the populated courses
            }
        },
        // Unwind the populatedCourses array to separate each course
        { $unwind: '$populatedCourses' },
        // Match documents where the term ID, professor ID, course ID, and semester ID match the specified values
        { 
            $match: match
        },
        // Group by student ID to prevent duplicate records
        {
            $group: {
                _id: '$_id',
                studentId: { $first: '$studentId' },
                firstName: { $first: '$firstName' },
                lastName: { $first: '$lastName' },
                active: { $first: '$active' },
                assignedMentors: { $first: '$assignedMentors' },
                contactNumber: { $first: '$contactNumber' },
                courseType: { $first: '$courseType' },
                courses: { $addToSet: '$populatedCourses' },
                eduEmail: { $first: '$eduEmail' },
                eduPassword: { $first: '$eduPassword' },
                personalEmail: { $first: '$personalEmail' },
                tracking: { $first: '$tracking' },
                university: { $first: '$university' }
                // Include other fields as needed
            }
        }
    ]).exec();
}

async function searchStudents(searchText) {
    console.log('entered studentService.searchStudents');
    const query = { active: true };
    const searchRegex = new RegExp(searchText, 'i');
    query['$or'] = [
        { studentId: searchRegex }, // Assuming studentId field name
        { $or: [
            { firstName: searchRegex },
            { lastName: searchRegex },
            { $text: { $search: searchText } } // For full name search if using text index
        ]}
    ];

    console.log("gettudents with query", query);
    return await db.Student.find(query).populate("university").populate({path: "courses.course", populate: "term"}).populate("courses.assignedMentors");
}

async function getStudentById(id) {
    return getStudent(id);
}

async function getStudent(id) {
    console.log(`entered studentService.getStudent ${id}`);
    if (!db.isValidId(id)) throw 'Student not found';
    const student = await db.Student.findOne({_id: id});
    if (!student) throw 'Student not found';
    if (student && !student.active) throw 'Student not found';
    return student;
}