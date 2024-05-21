const moment = require('moment');
const db = require('../_helpers/db');
const utils = require('../_helpers/utils');

module.exports = {
    createTask,
    updateTask,
    getAllTasks,
    getAllTasksForHandlerAllocation,
    getAllTasksForStudentTracker,
    getTaskById,
    deleteTask: _deleteTask
}

async function createTask(taskData, user) {
    console.log('entered taskService.createTask');
    const loggedInUser = await db.User.findById(user.id);
    const task = new db.Task(taskData);
    task.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await task.save();
}

async function updateTask(id, data, user) {
    console.log(`entered taskService.updateTask ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const task = await getTask(id);

    // copy data to task and save
    data.tracking = task.tracking;
    data.tracking.lastUpdatedDate = moment().toISOString();
    data.tracking.lastUpdatedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    Object.assign(task, data);
    await task.save();

    return task;
}

async function _deleteTask(id, user) {
    console.log(`entered taskService._deleteTask ${id}`);
    const loggedInUser = await db.User.findById(user.id);
    const task = await getTask(id);
    task.tracking.deletedDate = moment().toISOString();
    task.tracking.deletedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    task.markedAsDeleted = true;
    return await this.updateTask(id, task, user);
}

async function getAllTasks(loggedInUser, university, queryData) {
    console.log('entered taskService.getAllTasks');
    const query = { active: true, university };

    if (queryData.assignedMentors && queryData.assignedMentors !== 'all') {
        query["mentorAssigned"] = { $in: queryData.assignedMentors };
    }
    if (queryData.course && queryData.course !== 'all') {
        query["course"] = queryData.course;
    }
    if (queryData.week && queryData.week !== 'all') {
        query["week"] = queryData.week;
    }
    if (queryData.term) {
        query["term"] = queryData.term;
    }
    if (queryData.assignedMentors === 'all') {
        query["$and"] = query["$and"] || [];
        query["$and"].push(
            { mentorAssigned: { $exists: true, $ne: null } },
            { mentorAssigned: { $exists: true, $ne: [] } }
        );
    }

    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    } else {
        // Retrieve only tasks assigned to logged in user (Mentor)
        query["mentorAssigned"] = { $in: [loggedInUser.id] };
    }

    // Initial query to find tasks
    let tasks = await db.Task.find(query)
        .populate({ path: "topics" })
        .populate({ path: "course", populate: { path: "professor" } })
        .populate("student")
        .populate("university")
        .exec();

    // Filter tasks by professor if the queryData contains a professor
    if (queryData.professor && queryData.professor !== 'all') {
        tasks = tasks.filter(task => task.course && task.course.professor && task.course.professor?.id?.toString() === queryData.professor);
    }

    return tasks;
}

async function getAllTasksForHandlerAllocation(loggedInUser, university, queryData) {
    console.log('entered taskService.getAllTasks');
    const query = { active: true, university };

    query["$and"] = [
        {topics : {$exists: true, $ne: null}},
        {topics : {$exists: true, $ne: []}}
    ];

    if (queryData.assignedMentors && queryData.assignedMentors !== 'all') {
        query["mentorAssigned"] = { $in: queryData.assignedMentors };
    }
    if (queryData.course && queryData.course !== 'all') {
        query["course"] = queryData.course;
    }
    if (queryData.week && queryData.week !== 'all') {
        query["week"] = queryData.week;
    }
    if (queryData.term) {
        // query["term"] = queryData.term;
        query["$and"].push(
            {term: queryData.term}
        );
    }
    if (queryData.assignedMentors === 'all') {
        query["$and"].push(
            {mentorAssigned : {$exists: true, $ne: null}},
            {mentorAssigned : {$exists: true, $ne: []}}
        );
    }
    if (!query["$and"].length) {
        delete query["$and"];
    }

    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }
    return await db.Task.find(query).populate({path: "topics", populate: { path: "topic postedBy course"}}).populate({path: "course", populate: { path: "professor" }}).populate("student").populate("university").exec();
}

async function getAllTasksForStudentTracker(loggedInUser, params, queryData) {
    console.log('entered taskService.getAllTasksForStudentTracker');
    const query = { active: true, university: params.university };

    query["$and"] = [
        {topics : {$exists: true, $ne: null}},
        {topics : {$exists: true, $ne: []}}
    ];

    if (queryData.week && queryData.week !== 'all') {
        query["week"] = queryData.week;
    }
    if (queryData.status && queryData.status !== 'all') {
        query["status"] = queryData.status;
    }

    if (params.course) {
        query["course"] = params.course;
    }
    if (params.week && params.week !== 'all') {
        query["week"] = params.week;
    }
    if (params.term) {
        // query["term"] = params.term;
        query["$and"].push(
            {term: params.term}
        );
    }
    if (!query["$and"].length) {
        delete query["$and"];
    }

    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }
    return await db.Task.find(query).populate({path: "topics", populate: { path: "topic postedBy course", populate: {path: "category"} }}).populate({path: "course", populate: { path: "professor" }}).populate("student").populate("university").exec();
}

async function getTaskById(id) {
    return getTask(id);
}

async function getTask(id) {
    console.log(`entered taskService.getTask ${id}`);
    if (!db.isValidId(id)) throw 'Task not found';
    const task = await db.Task.findOne({_id: id});
    if (!task) throw 'Task not found';
    if (task && !task.active) throw 'Task not found';
    return task;
}