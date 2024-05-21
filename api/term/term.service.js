const moment = require('moment');
const db = require('../_helpers/db');
const utils = require('../_helpers/utils');

module.exports = {
    createTerm,
    updateTerm,
    getAllTerms,
    getTermById,
    deleteTerm: _deleteTerm
}

async function createTerm(termData, user) {
    console.log('entered termService.createTerm');
    const loggedInUser = await db.User.findById(user.id);
    const term = new db.Term(termData);
    term.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await term.save();
}

async function updateTerm(id, data, user) {
    console.log(`entered termService.updateTerm ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const term = await getTerm(id);

    // Update tracking information
    const updatedTracking = {
        ...term.tracking,
        lastUpdatedDate: moment().toISOString(),
        lastUpdatedBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };

    // Merge data with term
    const updatedTerm = {
        ...term,
        ...data,
        tracking: updatedTracking
    };

    // Save updated term
    Object.assign(term, updatedTerm);
    await term.save();

    return term;
}

async function _deleteTerm(id, user) {
    console.log(`entered termService._deleteTerm ${id}`);
    const loggedInUser = await db.User.findById(user.id);
    const term = await getTerm(id);
    term.tracking.deletedDate = moment().toISOString();
    term.tracking.deletedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    term.active = false;
    return await this.updateTerm(id, term, user);
}

async function getAllTerms(loggedInUser, university) {
    console.log('entered termService.getAllTerms');
    const query = { active: true, university };
    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }
    return await db.Term.find(query);
}

async function getTermById(id) {
    return getTerm(id);
}

async function getTerm(id) {
    console.log(`entered termService.getTerm ${id}`);
    if (!db.isValidId(id)) throw 'Term not found';
    const term = await db.Term.findOne({_id: id});
    if (!term) throw 'Term not found';
    if (term && !term.active) throw 'Term not found';
    return term;
}