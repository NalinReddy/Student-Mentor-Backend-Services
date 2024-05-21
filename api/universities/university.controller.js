const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const universityService = require("./university.service");
const authorize = require('../_middleware/authorize');
const validateRequest = require('../_middleware/validate-request');


//routes
router.post('/', authorize(), universityJoiSchema, createUniversity);
router.get('/', authorize(), getUniversities);
router.get('/:id', authorize(), getUniversityById);
router.put('/:id', authorize(), universityJoiSchema, updateUniversity);
router.delete('/:id', authorize(), deleteUniversity);
router.get('/:id/mentors', authorize(), getAssignedMentorsForUniversity);

module.exports = router;

// Joi Schema for validation
function universityJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        name: Joi.string().required(),
        courses: Joi.array().items(Joi.string()).allow(null), // Assuming courses are strings (IDs)
        professors: Joi.array().items(Joi.string()).allow(null), // Assuming professors are strings (IDs)
        students: Joi.array().items(Joi.string()).allow(null), // Assuming students are strings (IDs)
        tracking: Joi.object().required(),
        // active: Joi.boolean().required()
    });
    validateRequest(req, next, schema);
} 

// CREATE operation
async function createUniversity(req, res, next) {
    console.log("in api method")

    try {
        const university = await universityService.createUniversity(req.body, req.user);
       return res.status(201).json(university);

    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}

// READ operation
async function getUniversities(req, res) {
    try {
        const universities = await universityService.getAllUniversities(req.user);
        res.json(universities);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getUniversityById(req, res) {
    try {
        const university = await universityService.getUniversityById(req.params.id);
        if (!university) {
            return res.status(404).json({ error: 'University not found' });
        }
        res.json(university);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getAssignedMentorsForUniversity(req, res) {
    try {
        const mentors = await universityService.getAssignedMentorsForUniversity(req.params.id);
        res.json(mentors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE operation
async function updateUniversity(req, res) {
    try {
        // Validate the request body
        const { error } = universityJoiSchema.validate(req.body);
        if (error) {
            return res.status(400).json({ error: error.details[0].message });
        }

        const university = await universityService.updateUniversity(req.params.id, req.body, req.user);
        if (!university) {
            return res.status(404).json({ error: 'University not found' });
        }
        res.json(university);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE operation
async function deleteUniversity(req, res) {
    try {
        const university = await universityService.deleteUniversity(req.params.id, req.user);
        if (!university) {
            return res.status(404).json({ error: 'University not found' });
        }
        res.json({ message: 'University deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};