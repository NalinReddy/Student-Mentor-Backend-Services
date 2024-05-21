const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    studentId: {type: String, trim: true, required: true},
    student: {type: Schema.Types.ObjectId, ref: 'Student', trim: true, required: true},
    assignedMentor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    tracking: {
        type: Object,
        required: true
    },
    active: {type: Boolean, required: true, default: true}
});

schema.index({ studentId: 1 });
schema.index({ assignedMentor: 1 });

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        // delete ret.markedAsDeleted;
    }
});

module.exports = mongoose.model('StudentCourseMentorMapping', schema);
