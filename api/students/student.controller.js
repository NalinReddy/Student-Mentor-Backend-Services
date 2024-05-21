const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const studentService = require("./student.service");
const authorize = require('../_middleware/authorize');
const validateRequest = require('../_middleware/validate-request');

// Routes
router.post('/', authorize(), studentJoiSchema, createStudent);
router.post('/getAllStudents', authorize(), getStudentsJoiSchema, getStudents);
router.post('/search', authorize(), searchStudents);
router.post('/deepSearch', authorize(), deepSearchStudents);
router.post('/form-data', authorize(), addStudentFormData);
router.put('/form-data', authorize(), updateStudentFormData);
router.get('/:id', authorize(), getStudentById);
router.put('/:id', authorize(), studentJoiSchema, updateStudent);
router.delete('/:id', authorize(), deleteStudent);

// Joi Schema for validation
function studentJoiSchema(req, res, next) {
    const schema = Joi.object({
        studentId: Joi.string().trim().required(),
        firstName: Joi.string().trim().required(),
        lastName: Joi.string().trim().required(),
        personalEmail: Joi.string().email().trim().required(),
        contactNumber: Joi.string().trim().allow(null),
        eduEmail: Joi.string().email().trim(),
        eduPassword: Joi.string().trim(),
        courseType: Joi.string().allow(null), // Assuming courseType is a string (ID)
        // joiningDate: Joi.date().required(),
        assignedMentors: Joi.array().items(Joi.string()).allow(null), // Assuming mentorsAssigned are strings (IDs)
        courses: Joi.array().items(Joi.object({course: Joi.string(), assignedMentors: Joi.array().items(Joi.string())}).disallow(null)).allow(null), // Assuming courses are strings (IDs)
        university: Joi.string().required(), // Assuming university is a string (ID)
        tracking: Joi.object().required(),
        active: Joi.boolean().required()
    });
    validateRequest(req, next, schema);
} 

// Joi Schema for validation
function getStudentsJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        university: Joi.string().disallow('')
    });
    validateRequest(req, next, schema);
} 

// CREATE operation
async function createStudent(req, res, next) {
    try {
        const student = await studentService.createStudent(req.body, req.user);
        res.status(201).json(student);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// READ operation
async function getStudents(req, res) {
    try {
        const students = await studentService.getAllStudents(req.user, req.body.university, req.query);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function searchStudents(req, res) {
    try {
        const students = await studentService.searchStudents(req.body.searchText);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

async function addStudentFormData(req, res, next) {
    try {
        const FormData = await studentService.addStudentFormData(req.body, req.user);
        res.status(201).json(FormData);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

async function updateStudentFormData(req, res, next) {
    try {
        const FormData = await studentService.updateStudentFormData(req.params.id, req.body, req.user);
        if (!FormData) {
            return res.status(404).json({ error: 'Student Form data not found' });
        }
        res.status(201).json(FormData);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// READ operation
async function deepSearchStudents(req, res) {
    try {
        const students = await studentService.deepSearchStudents(req.body, req.user);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getStudentById(req, res) {
    try {
        const student = await studentService.getStudentById(req.params.id);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE operation
async function updateStudent(req, res) {
    try {

        const student = await studentService.updateStudent(req.params.id, req.body, req.user);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(student);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE operation
async function deleteStudent(req, res) {
    try {
        const student = await studentService.deleteStudent(req.params.id, req.user);
        if (!student) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ message: 'Student deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = router;