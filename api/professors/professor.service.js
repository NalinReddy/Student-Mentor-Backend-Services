const moment = require('moment');
const db = require('../_helpers/db');
const utils = require('../_helpers/utils');

module.exports = {
    createProfessor,
    updateProfessor,
    getAllProfessors,
    getProfessorById,
    deleteProfessor: _deleteProfessor
}

async function createProfessor(professorData, user) {
    console.log('entered professorService.createProfessor');
    const loggedInUser = await db.User.findById(user.id);
    const professor = new db.Professor(professorData);
    professor.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await professor.save();
}

async function updateProfessor(id, data, user) {
    console.log(`entered professorService.updateProfessor ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const professor = await getProfessor(id);

    // copy data to professor and save
    data.tracking = {...professor.tracking, lastUpdatedDate : moment().toISOString(), lastUpdatedBy : `${loggedInUser.firstName} ${loggedInUser.lastName}`};
    Object.assign(professor, data);
    await professor.save();

    return professor;
}

async function _deleteProfessor(id, user) {
    console.log(`entered professorService._deleteProfessor ${id}`);
    const loggedInUser = await db.User.findById(user.id);
    const professor = await getProfessor(id);
    professor.tracking["deletedDate"] = moment().toISOString();
    professor.tracking["deletedBy"] = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    professor.active = false;
    return await this.updateProfessor(id, professor, user);
}

async function getAllProfessors(loggedInUser, university) {
    console.log('entered termService.getAllProfessors');
    const query = { active: true, university };
    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }
    return await db.Professor.find(query);
}

async function getProfessorById(id) {
    return getProfessor(id);
}

async function getProfessor(id) {
    console.log(`entered professorService.getProfessor ${id}`);
    if (!db.isValidId(id)) throw 'Professor not found';
    const professor = await db.Professor.findOne({_id: id});
    if (!professor) throw 'Professor not found';
    if (professor && !professor.active) throw 'Professor not found';
    return professor;
}