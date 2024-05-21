const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const taskService = require("./task.service");
const authorize = require('../_middleware/authorize');
const validateRequest = require('../_middleware/validate-request');
const taskStatusType = require('../_helpers/task-status.type');

// Routes
router.post('/', authorize(), createTaskJoiSchema, createTask);
router.post('/getAllTasks', authorize(), getTasksJoiSchema, getTasks);
router.post('/getAllTasksForHandlerAllocation', authorize(), getTasksJoiSchema, getAllTasksForHandlerAllocation);
router.post('/getAllTasksForStudentTracker', authorize(), getAllTasksForStudentTracker);
router.get('/:id', authorize(), getTaskById);
router.put('/:id', authorize(), createTaskJoiSchema, updateTask);
router.delete('/:id', authorize(), deleteTask);

// Joi Schema for validation
function createTaskJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        title: Joi.string().allow(null),
        profComments: Joi.string().allow(null).allow(""),
        profPref: Joi.string().allow(null).allow(""),
        grade: Joi.string().allow(null).allow(""),
        discussions: Joi.string().allow(null),
        repliesStatus: Joi.string().allow(null),
        studentId: Joi.string().required(),
        student: Joi.string().required(),
        course: Joi.string().required(),
        week: Joi.number().required(),
        mentorAssigned: Joi.array().items(Joi.string()).required(),
        status: Joi.string().valid(taskStatusType.COMPLETED, taskStatusType.IN_PROGRESS, taskStatusType.NOT_STARTED).required(),
        topics: Joi.array().allow(null),
        professors: Joi.string().allow(null),
        university: Joi.string().required().disallow(''),
        dueDate  : Joi.any(),
        joiningDate  : Joi.any(),
        priority : Joi.number(),
        tags     : Joi.array(),
        tracking: Joi.object().required(),
        active: Joi.boolean().required()
    });
    validateRequest(req, next, schema);
} 

// Joi Schema for validation
function getTasksJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        university: Joi.string().disallow('')
    });
    validateRequest(req, next, schema);
} 

// CREATE operation
async function createTask(req, res, next) {
    try {
        console.log("body..", req.body);
        const course = await taskService.createTask(req.body, req.user);
        res.status(201).json(course);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// READ operation
async function getTasks(req, res) {
    try {
        const tasks = await taskService.getAllTasks(req.user, req.body.university, req.query);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// READ operation
async function getAllTasksForHandlerAllocation(req, res) {
    try {
        const tasks = await taskService.getAllTasksForHandlerAllocation(req.user, req.body.university, req.query);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getAllTasksForStudentTracker(req, res) {
    try {
        const tasks = await taskService.getAllTasksForStudentTracker(req.user, req.body.params, req.query);
        res.json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getTaskById(req, res) {
    try {
        const task = await taskService.getCourseById(req.params.id);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE operation
async function updateTask(req, res) {
    try {
        const task = await taskService.updateTask(req.params.id, req.body, req.user);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE operation
async function deleteTask(req, res) {
    try {
        const task = await taskService.deleteTask(req.params.id, req.user);
        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = router;