const config = require('../config/config');
const db = require('../_helpers/db');
const moment = require('moment');
const utils = require('../_helpers/utils');
const { ObjectID } = require('mongodb');


module.exports = {
    createUniversity,
    updateUniversity,
    getAllUniversities,
    getUniversityById,
    deleteUniversity: _deleteUniversity,
    getAssignedMentorsForUniversity
}

async function createUniversity(universityData, user) {
    console.log('entered universityservice.createUniversity');
    // get the current user
    const loggedInUser = await db.User.findById(user.id);
    // Create new university
    const university = new db.University(universityData);
    university.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await university.save();
}

async function updateUniversity(id, data, user) {
    console.log(`entered universityservice.updateUniversity ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const university = await getUniversity(id);

    // copy data to university and save
    data.tracking = university.tracking;
    data.tracking.lastUpdatedDate = moment().toISOString();
    data.tracking.lastUpdatedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    Object.assign(university, data);
    await university.save();

    return university;
}

async function _deleteUniversity(id, user) {
    console.log(`entered configurationservice._deleteUniversity ${id}`);
    const loggedInUser = await db.User.findById(user.id);
    const university = await getUniversity(id);
    university.tracking.deletedDate = moment().toISOString();
    university.tracking.deletedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    university.markedAsDeleted = true;
    return await this.updateUniversity(id, university, user);
}

async function getAllUniversities(loggedInUser) {
    console.log('entered getAllUniversities.getAllUniversities');
    const query = { active: true };
    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    } else {
        query['mentors'] = {$in: [loggedInUser.id]}
    }
    console.log("QUery", query);
    return await db.University.find(query);
}

async function getUniversityById(id) {
    return getUniversity(id);
}

async function getUniversity(id) {
    console.log(`entered universityservice.getChassis ${id}`);
    if (!db.isValidId(id)) throw 'University not found';
    const university = await db.University.findOne({_id: id});
    if (!university) throw 'University not found';
    if (university && !university.active) throw 'University not found';
    return university;
}

async function getAssignedMentorsForUniversity(universityId) {
    try {

        const assignedMentors = await db.Task.aggregate([
            {
                $match: { 'university': new ObjectID(universityId) }
            },
            {
                $unwind: '$mentorAssigned' // Unwind the mentorAssigned array
            },
            {
                $group: {
                    _id: '$mentorAssigned', // Group by mentor ID
                }
            },
            {
                $lookup: {
                    from: 'users', // User collection name
                    localField: '_id',
                    foreignField: '_id',
                    as: 'mentorDetails'
                }
            },
            {
                $project: {
                    _id: 0, // Exclude _id field
                    mentorDetails: { $arrayElemAt: ['$mentorDetails', 0] }, // Mentor details
                }
            }
        ]);

        return assignedMentors.map(mentor => mentor.mentorDetails );
    } catch (error) {
        console.error('Error fetching assigned mentors:', error);
        throw error;
    }
}