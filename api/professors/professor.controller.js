const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const professorService = require("./professor.service");
const authorize = require('../_middleware/authorize');
const validateRequest = require('../_middleware/validate-request');

// Routes
router.post('/', authorize(), professorJoiSchema, createProfessor);
router.post('/getAllProfessors', authorize(), getAllProfessors);
router.get('/:id', authorize(), getProfessorById);
router.put('/:id', authorize(), professorJoiSchema, updateProfessor);
router.delete('/:id', authorize(), deleteProfessor);

// Joi Schema for validation
function professorJoiSchema(req, res, next) {
    const schema = Joi.object({
        title: Joi.string().trim().required(),
        firstName: Joi.string().trim().required(),
        lastName: Joi.string().trim().required(),
        email: Joi.string().email().trim().allow(null).allow(""),
        university: Joi.string().required(),
        tracking: Joi.object().required(),
        active: Joi.boolean().required()
    });
    validateRequest(req, next, schema);
} 

// CREATE operation
async function createProfessor(req, res, next) {
    try {
        const professor = await professorService.createProfessor(req.body, req.user);
        res.status(201).json(professor);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}


// READ operation
async function getAllProfessors(req, res) {
    try {
        const professors = await professorService.getAllProfessors(req.user, req.body.university);
        res.json(professors);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getProfessorById(req, res) {
    try {
        const professor = await professorService.getProfessorById(req.params.id);
        if (!professor) {
            return res.status(404).json({ error: 'Professor not found' });
        }
        res.json(professor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE operation
async function updateProfessor(req, res) {
    try {

        const professor = await professorService.updateProfessor(req.params.id, req.body, req.user);
        if (!professor) {
            return res.status(404).json({ error: 'Professor not found' });
        }
        res.json(professor);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// DELETE operation
async function deleteProfessor(req, res) {
    try {
        const professor = await professorService.deleteProfessor(req.params.id, req.user);
        if (!professor) {
            return res.status(404).json({ error: 'Professor not found' });
        }
        res.json({ message: 'Professor deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = router;