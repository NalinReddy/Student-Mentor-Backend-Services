const moment = require('moment');
const db = require('../_helpers/db');
const utils = require('../_helpers/utils');

module.exports = {
    createCourse,
    updateCourse,
    getAllCourses,
    getCourseById,
    deleteCourse: _deleteCourse
}

async function createCourse(courseData, user) {
    console.log('entered courseService.createCourse');
    const loggedInUser = await db.User.findById(user.id);
    const course = new db.Course(courseData);
    course.termPeriod = courseData.termPeriod
    console.log(course, courseData.termPeriod);
    course.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await course.save();
}

async function updateCourse(id, data, user) {
    console.log(`entered courseService.updateCourse ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const course = await getCourse(id);

     // Update tracking information
     const updatedTracking = {
        ...course.tracking,
        lastUpdatedDate: moment().toISOString(),
        lastUpdatedBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };

    // Merge data with course
    const updatedCourse = {
        ...course,
        ...data,
        tracking: updatedTracking
    };

    // Save updated course
    Object.assign(course, updatedCourse);

    await course.save();

    return course;
}

async function _deleteCourse(id, user) {
    console.log(`entered courseService._deleteCourse ${id}`);
    const loggedInUser = await db.User.findById(user.id);
    const course = await getCourse(id);
    course.tracking.deletedDate = moment().toISOString();
    course.tracking.deletedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    course.markedAsDeleted = true;
    return await this.updateCourse(id, course, user);
}

async function getAllCourses(loggedInUser, university) {
    console.log('entered courseService.getAllCourses');
    const query = { active: true, university };
    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }
    return await db.Course.find(query).populate("term").populate("professor");
}

async function getCourseById(id) {
    return getCourse(id);
}

async function getCourse(id) {
    console.log(`entered courseService.getCourse ${id}`);
    if (!db.isValidId(id)) throw 'Course not found';
    const course = await db.Course.findOne({_id: id});
    if (!course) throw 'Course not found';
    if (course && !course.active) throw 'Course not found';
    return course;
}