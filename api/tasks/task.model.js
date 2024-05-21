const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TaskStatus = require("../_helpers/task-status.type");

const schema = new Schema({
    title: {type: String, trim: true},
    studentId: {type: String, trim: true, required: true},
    student: {type: mongoose.Schema.Types.ObjectId, ref: 'Student'},
    // courseType: { type: Schema.Types.ObjectId, ref: 'CourseType' },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    term: {type: Schema.Types.ObjectId, ref: 'Term', required: true},
    week: {type: Number},
    joiningDate: {type: Date},
    grade: {type: String},
    profComments: {type: String}, // professor comments
    profPref: {type: String}, // professor preference
    discussions: {type: String}, // json with all the discussions with in the respective week
    repliesStatus: {type: String}, // json with all the repliesStatus with in the respective week
    topics: [{type: Schema.Types.ObjectId, ref: 'Topic', required: true}],
    taskStats: {
        inProgress: {type: Number, default: 0},
        completed: {type: Number, default: 0},
        notStarted: {type: Number, default: 0},
        total: {type: Number, default: 0},
        overdue: {type: Number, default: 0},
        closedToday: {type: Number, default: 0}
    },
    mentorAssigned: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    dueDate: {type: Date},
    priority: {type: Number, default: 0},
    tags: {type: Array, default: []},
    status: {type: String, required: true, default: TaskStatus.NOT_STARTED}, 
    tracking: {
        type: Object,
        required: true
    },
    active: {type: Boolean, required: true, default: true}
});

// should admin assign a mentor to a student for a course?
// Should discussion1,2,3... and replies status1,2,3.... should be for a specific topic or can it be for the whole task(course)
// Where are we making the task has completed? (As In tasks screen, we are seeing topics status but not overall task status.  )

// Define a post-save middleware to update the course stats after saving a Task document
// schema.post('save', async function (doc) {
//     const Task = this.constructor; // Get the model of the saved document
//     const Course = mongoose.model('Course');

//     try {
//         const courseId = doc.course; // Get the ID of the course related to the saved task

//         // Find all tasks related to the current Course
//         const tasks = await Task.find({ course: courseId });

//         // Calculate the stats based on the status of tasks
//         const stats = {
//             inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
//             completed: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
//             notStarted: tasks.filter(task => task.status === TaskStatus.NOT_STARTED).length,
//             total: tasks.length
//         };

//         // Update the tasksStats field of the related Course document
//         await Course.findByIdAndUpdate(courseId, { $set: { tasksStats: stats } });

//     } catch (error) {
//         console.error('Error updating course stats:', error);
//     }
// });



schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        // delete ret.markedAsDeleted;
    }
});

module.exports = mongoose.model('Task', schema);
