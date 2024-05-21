const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const courseService = require("./course.service");
const authorize = require('../_middleware/authorize');
const validateRequest = require('../_middleware/validate-request');

// Routes
router.post('/', authorize(), courseJoiSchema, createCourse);
router.post('/getAllCourses', authorize(), getCoursesJoiSchema, getUniversities);
router.get('/:id', authorize(), getCourseById);
router.put('/:id', authorize(), courseJoiSchema, updateCourse);
router.delete('/:id', authorize(), deleteCourse);

// Joi Schema for validation
function courseJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        name: Joi.string().required(),
        term: Joi.string().required(),
        termPeriod: Joi.object({
            type: Joi.string().valid('Full-Term', 'Bi-Term1', 'Bi-Term2').required(),
            startWeek: Joi.number().integer().required(),
            endWeek: Joi.number().integer().required()
        }).required().disallow({}),
        professor: Joi.string().allow(null),
        // mentors: Joi.array().items(Joi.string().disallow(null)).allow(null),
        university: Joi.string().required().disallow(''),
        tracking: Joi.object().required(),
        active: Joi.boolean().required()
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
async function createCourse(req, res, next) {
    try {
        console.log("body..", req.body);
        const course = await courseService.createCourse(req.body, req.user);
        res.status(201).json(course);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// READ operation
async function getUniversities(req, res) {
    try {
        const courses = await courseService.getAllCourses(req.user, req.body.university);
        res.json(courses);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getCourseById(req, res) {
    try {
        const course = await courseService.getCourseById(req.params.id);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE operation
async function updateCourse(req, res) {
    try {
        const course = await courseService.updateCourse(req.params.id, req.body, req.user);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json(course);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE operation
async function deleteCourse(req, res) {
    try {
        const course = await courseService.deleteCourse(req.params.id, req.user);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }
        res.json({ message: 'Course deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = router;