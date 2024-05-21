const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const termService = require("./term.service");
const authorize = require('../_middleware/authorize');
const validateRequest = require('../_middleware/validate-request');

// Routes
router.post('/', authorize(), termJoiSchema, createTerm);
router.post('/getAllterms', authorize(), getTermsJoiSchema, getTerms);
router.get('/:id', authorize(), getTermById);
router.put('/:id', authorize(), termJoiSchema, updateTerm);
router.delete('/:id', authorize(), deleteTerm);

// Joi Schema for validation
function termJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        name: Joi.string().required(),
        startDate: Joi.date().required(),
        endDate: Joi.date().required(),
        university: Joi.string().required().disallow(''),
        tracking: Joi.object().required(),
        active: Joi.boolean().required()
    });
    validateRequest(req, next, schema);
} 

// Joi Schema for validation
function getTermsJoiSchema(req, res, next){
    console.log("in joi schema validation")
    const schema = Joi.object({
        university: Joi.string().disallow('')
    });
    validateRequest(req, next, schema);
} 

// CREATE operation
async function createTerm(req, res, next) {
    try {
        console.log("body..", req.body);
        const term = await termService.createTerm(req.body, req.user);
        res.status(201).json(term);

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
}

// READ operation
async function getTerms(req, res) {
    try {
        const terms = await termService.getAllTerms(req.user, req.body.university);
        res.json(terms);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// READ operation
async function getTermById(req, res) {
    try {
        const term = await termService.getTermById(req.params.id);
        if (!term) {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.json(term);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// UPDATE operation
async function updateTerm(req, res) {
    try {
        const term = await termService.updateTerm(req.params.id, req.body, req.user);
        if (!term) {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.json(term);
    } catch (err) {
        res.status(500).json({ error: err });
    }
};

// DELETE operation
async function deleteTerm(req, res) {
    try {
        const term = await termService.deleteTerm(req.params.id, req.user);
        if (!term) {
            return res.status(404).json({ error: 'Term not found' });
        }
        res.json({ message: 'Term deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = router;