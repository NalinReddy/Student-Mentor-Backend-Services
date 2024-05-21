const { string } = require('@hapi/joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: String,
    courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
    professors: [{type: mongoose.Schema.Types.ObjectId, ref: 'Professor'}],
    students: [{type: mongoose.Schema.Types.ObjectId, ref: 'Student'}],
    // To show the mentors only the list of universities they have assigned.
    mentors: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
    active: {type: Boolean, required: true, default: true},
    tracking: {
        type: Object,
        required: true
    }
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        // delete ret.markedAsDeleted;
    }
});

module.exports = mongoose.model('University', schema);
