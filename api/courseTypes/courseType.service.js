const moment = require('moment');
const db = require('../_helpers/db');

module.exports = {
    createCourseType,
    updateCourseType,
    getAllCourseTypes,
    getCourseTypeById,
    deleteCourseType: _deleteCourseType
}

async function createCourseType(courseTypeData, user) {
    console.log('entered courseTypeService.createCourseType');
    const loggedInUser = await db.User.findById(user.id);
    const courseType = new db.CourseType(courseTypeData);
    courseType.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await courseType.save();
}

async function updateCourseType(id, data, user) {
    console.log(`entered courseTypeService.updateCourseType ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const courseType = await getCourseType(id);

    // copy data to courseType and save
    data.tracking = courseType.tracking;
    data.tracking.lastUpdatedDate = moment().toISOString();
    data.tracking.lastUpdatedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    Object.assign(courseType, data);
    await courseType.save();

    return courseType;
}

async function _deleteCourseType(id, user) {
    console.log(`entered courseTypeService._deleteCourseType ${id}`);
    const loggedInUser = await db.User.findById(user.id);
    const courseType = await getCourseType(id);
    courseType.tracking.deletedDate = moment().toISOString();
    courseType.tracking.deletedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    courseType.markedAsDeleted = true;
    return await this.updateCourseType(id, courseType, user);
}

async function getAllCourseTypes() {
    console.log('entered courseTypeService.getAllCourseTypes');
    return await db.CourseType.find({
        active: true
    });
}

async function getCourseTypeById(id) {
    return getCourseType(id);
}

async function getCourseType(id) {
    console.log(`entered courseTypeService.getCourseType ${id}`);
    if (!db.isValidId(id)) throw 'CourseType not found';
    const courseType = await db.CourseType.findOne({_id: id});
    if (!courseType) throw 'CourseType not found';
    if (courseType && !courseType.active) throw 'CourseType not found';
    return courseType;
}