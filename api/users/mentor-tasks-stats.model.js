const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    mentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    taskStats: {
        inProgress: {type: Number, default: 0},
        completed: {type: Number, default: 0},
        notStarted: {type: Number, default: 0},
        total: {type: Number, default: 0}
    },
    topicStats: {
        inProgress: {type: Number, default: 0},
        completed: {type: Number, default: 0},
        notStarted: {type: Number, default: 0},
        total: {type: Number, default: 0},
        overdue: {type: Number, default: 0},
        closedToday: {type: Number, default: 0}
    },
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
    }
});

module.exports = mongoose.model('MentorTasksStats', schema);
