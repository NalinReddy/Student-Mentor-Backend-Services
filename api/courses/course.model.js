const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// FOr an example:
// Create a course with term periods
// const course = new Course({
//     name: 'Course 1',
//     termPeriods: [
//       { type: 'FullTerm', startWeek: 1, endWeek: 16 },
//       { type: 'Bi-Term1', startWeek: 1, endWeek: 8 },
//       { type: 'Bi-Term2', startWeek: 9, endWeek: 16 }
//     ]
//   });

const schema = new Schema({
    name: {type: String, required: true},
    term: {type: Schema.Types.ObjectId, ref: 'Term', required: true},
    termPeriod:
    {
        type: {
            type: String,
            enum: ['Full-Term', 'Bi-Term1', 'Bi-Term2']
        },
        startWeek: Number,
        endWeek: Number
    },
    professor: { type: Schema.Types.ObjectId, ref: 'Professor' },
    // mentors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    university: { type: Schema.Types.ObjectId, ref: 'University' },
    tasksStats: {
        inProgress: {type: Number, default: 0},
        completed: {type: Number, default: 0},
        notStarted: {type: Number, default: 0},
        total: {type: Number, default: 0}
    },
    tracking: {
        type: Object,
        required: true
    },
    active: {type: Boolean, required: true, default: true}
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

module.exports = mongoose.model('Course', schema);
