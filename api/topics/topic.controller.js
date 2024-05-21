const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const topicService = require("./topic.service");
const authorize = require('../_middleware/authorize');
const validateRequest = require('../_middleware/validate-request');
const taskStatusType = require('../_helpers/task-status.type');

// Routes
router.post('/', authorize(), topicJoiSchema, createTopic);
router.post('/getAllTopics', authorize(), getCoursesJoiSchema, getAllTopics);
router.get('/categories', authorize(), getCategories);
router.get('/getHandlerTopicStatus', authorize(), getHandlerTopicStatus);
router.get('/:id', authorize(), getCourseById);
router.put('/:id', authorize(), topicJoiSchema, updateTopic);
router.delete('/:id', authorize(), deleteCourse);
// Lookup routes
router.post('/lookup', authorize(), topicLookupJoiSchema, createTopicLookup);
router.put('/lookup/:id', authorize(), topicLookupJoiSchema, updateTopicLookup);
router.get('/lookup/getAll', authorize(), getAllTopicsLookup);

// Joi Schema for validation
function topicLookupJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        name: Joi.string().required(),
        category: Joi.string().required(),
        tracking: Joi.object().required(),
        active: Joi.boolean().required()
    });
    validateRequest(req, next, schema);
} 


// Joi Schema for validation
function topicJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        title: Joi.string().allow(null),
        // discussion: Joi.string(),
        // reply: Joi.string(),
        studentId: Joi.string().required(),
        student: Joi.string().required(),
        course: Joi.string().required(),
        topic: Joi.string().required().allow(null).allow(""),
        task: Joi.string().required(),
        week: Joi.number().required(),
        postedBy: Joi.string().allow(null),
        postedDate: Joi.any().allow(null),
        mentorAssigned: Joi.array().items(Joi.string().disallow(null)).required(),
        status: Joi.string().valid(taskStatusType.COMPLETED, taskStatusType.IN_PROGRESS, taskStatusType.NOT_STARTED).required(),
        // professors: Joi.string().allow(null),
        university: Joi.string().required().disallow(''),
        dueDate  : Joi.any(),
        priority : Joi.number(),
        tags     : Joi.array(),
        tracking: Joi.object().required(),
        active: Joi.boolean().required(),
        order: Joi.number()
    });
    validateRequest(req, next, schema);
} 

// Joi Schema for validation
function getCoursesJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        university: Joi.string().disallow('')
    });
    validateRequest(req, next, schema);
} 

// CREATE operation
async function createTopic(req, res, next) {
    try {
        console.log("body..", req.body);
        const course = await topicService.createTopic(req.body, req.user);
        res.status(201).json(course);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// CREATE operation
async function createTopicLookup(req, res, next) {
    try {
        console.log("body..", req.body);
        const course = await topicService.createTopicLookup(req.body, req.user);
        res.status(201).json(course);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}
// Update operation
async function updateTopicLookup(req, res, next) {
    try {
        const topic = await topicService.updateTopicLookup(req.params.id, req.body, req.user);
        if (!topic) {
            return res.status(404).json({ error: 'Topic lookup not found' });
        }
        res.json(topic);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// READ operation
async function getAllTopics(req, res) {
    try {
        const topics = await topicService.getAllTopics(req.user, req.body.university);
        res.json(topics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

async function getCategories(req, res) {
    try {
        const topics = await topicService.getCategories(req.user);
        res.json(topics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

async function getHandlerTopicStatus(req, res) {
    try {
        const topics = await topicService.getHandlerTopicStatus(req.query, req.user);
        res.json(topics);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getAllTopicsLookup(req, res) {
    try {
        const topicLookup = await topicService.getAllTopicsLookup(req.user);
        res.json(topicLookup);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getCourseById(req, res) {
    try {
        const course = await topicService.getCourseById(req.params.id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE operation
async function updateTopic(req, res) {
    try {
        const topic = await topicService.updateTopic(req.params.id, req.body, req.user);
        if (!topic) {
            return res.status(404).json({ error: 'Topic not found' });
        }
        res.json(topic);
    } catch (err) {
        res.status(500).json({ error: err });
    }
};

// DELETE operation
async function deleteCourse(req, res) {
    try {
        const course = await topicService.deleteCourse(req.params.id, req.user);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = router;