const moment = require('moment');
const db = require('../_helpers/db');
const utils = require('../_helpers/utils');
const TaskStatus = require("../_helpers/task-status.type");

module.exports = {
    createTopic,
    createTopicLookup,
    updateTopic,
    updateTopicLookup,
    getAllTopics,
    getAllTopicsLookup,
    getCategories,
    getCourseById,
    getHandlerTopicStatus,
    deleteCourse: _deleteCourse
}

async function createTopic(topicData, user) {
    console.log('entered topicService.createTopic');
    const loggedInUser = await db.User.findById(user.id);
    const topic = new db.Topic(topicData);
    topic.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await topic.save();
}

async function createTopicLookup(topicData, user) {
    console.log('entered topicService.createTopic');
    const loggedInUser = await db.User.findById(user.id);
    const topic = new db.TopicLookup(topicData);
    topic.tracking = {
        createdDate: moment().toISOString(),
        createdBy: `${loggedInUser.firstName} ${loggedInUser.lastName}`
    };
    
    return await topic.save();
}

async function updateTopicLookup(id, data, user) {
    console.log(`entered topicService.updateTopicLookup ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const topic = await db.TopicLookup.findById(id);

    // copy data to topic and save
    data.tracking = topic.tracking;
    data.tracking.lastUpdatedDate = moment().toISOString();
    data.tracking.lastUpdatedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    Object.assign(topic, data);
    await topic.save();

    return topic;
}

async function updateTopic(id, data, user) {
    console.log(`entered topicService.updateTopic ${id} ${JSON.stringify(data)}`);
    const loggedInUser = await db.User.findById(user.id);
    const topic = await getTopic(id);

    // copy data to topic and save
    data.tracking = topic.tracking;
    data.tracking.lastUpdatedDate = moment().toISOString();
    data.tracking.lastUpdatedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    Object.assign(topic, data);
    console.log("************",topic);
    await topic.save();

    return topic;
}

async function _deleteCourse(id, user) {
    console.log(`entered topicService._deleteCourse ${id}`);
    const loggedInUser = await db.User.findById(user.id);
    const topic = await getTopic(id);
    topic.tracking.deletedDate = moment().toISOString();
    topic.tracking.deletedBy = `${loggedInUser.firstName} ${loggedInUser.lastName}`;
    topic.markedAsDeleted = true;
    return await this.updateCourse(id, topic, user);
}

async function getAllTopics(loggedInUser, university) {
    console.log('entered topicService.getAllTopics');
    const query = { active: true, university };
    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }
    return await db.Topic.find(query);
}
async function getAllTopicsLookup(loggedInUser) {
    console.log('entered topicService.getAllTopicsLookup');
    const query = { active: true  };
    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }
    return await db.TopicLookup.find(query).sort({category: 1, name: 1});
}
async function getCategories(loggedInUser) {
    console.log('entered topicService.getCategories');
    const query = { active: true  };
    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }

    return await db.TopicLookupCategory.find(query).sort({name: 1});
}

async function getHandlerTopicStatus(params, loggedInUser) {
    console.log('entered topicService.getHandlerTopicStatus');

    const query = {
        active: true,
        university: params.university,
        week: params.week
    };

    if (utils.isAdministrator(loggedInUser.role)) {
        delete query.active;
    }

    // Fetch the topics with the populated category and mentorAssigned
    const topics = await db.Topic.find(query)
        .populate('mentorAssigned')
        .populate({ path: 'topic', populate: { path: 'category' } })
        .exec();

    // Filter topics based on the category criteria
    const filteredTopics =
        params.category !== 'all'
            ? topics.filter((topic) => {
                  return topic.topic.category?._id?.equals(params.category);
              })
            : topics;

    // Perform the aggregation manually on the filtered topics
    const statusCounts = filteredTopics.reduce((counts, topic) => {
        let category = topic.topic.category;
        topic.mentorAssigned.forEach((mentor) => {
            if (!counts[`${mentor._id}_${category.id}`]) {
                counts[`${mentor._id}_${category.id}`] = {
                    category: { name: category.name, id: category._id },
                    mentor: { id: mentor.id, name: `${mentor.title} ${mentor.firstName} ${mentor.lastName}` },
                    total: 0,
                    pending: 0,
                    completed: 0
                };
            }

            counts[`${mentor._id}_${category.id}`].total += 1;
            if (topic.status === TaskStatus.NOT_STARTED || topic.status === TaskStatus.IN_PROGRESS) {
                counts[`${mentor._id}_${category.id}`].pending += 1;
            } else if (topic.status === TaskStatus.COMPLETED) {
                counts[`${mentor._id}_${category.id}`].completed += 1;
            }
        });
        return counts;
    }, {});

    // Convert the object to an array to include mentor details
    const result = Object.values(statusCounts);

    return result;
}

async function getCourseById(id) {
    return getTopic(id);
}

async function getTopic(id) {
    console.log(`entered topicService.getTopic ${id}`);
    if (!db.isValidId(id)) throw 'Topic not found';
    const topic = await db.Topic.findOne({_id: id});
    if (!topic) throw 'Topic not found';
    if (topic && !topic.active) throw 'Topic not found';
    return topic;
}