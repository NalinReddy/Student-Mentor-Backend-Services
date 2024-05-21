const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TaskStatus = require("../_helpers/task-status.type");

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
    title: { type : String, trim: true },
    topic: { type: Schema.Types.ObjectId, ref: 'TopicLookup'},
    task: { type: Schema.Types.ObjectId, ref: 'Task', required: true},
    postedBy: { type: Schema.Types.ObjectId, ref: 'Member' }, // 
    postedDate: {type: Date}, // 
    mentorAssigned: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    studentId: {type: String, trim: true, required: true},
    student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
    course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
    discussion: {type: String},
    reply: {type: String},
    week: {type: Number, required: true},
    dueDate: {type: Date},
    priority: {type: Number, default: 0},
    tags: {type: Array, default: []},
    order: {type: Number, default: 0},
    status: {type: String, required: true, default: TaskStatus.NOT_STARTED},
    tracking: {
        type: Object,
        required: true
    },
    active: {type: Boolean, required: true, default: true}
});


// // Define a pre-save middleware to check if topic is null or an empty string, and delete the record in that case
// schema.pre('save', async function (next) {
//     if (!this.topic || (typeof this.topic === 'string' && this.topic.trim() === '')) {
//         try {
//             await this.remove();
//             console.log('Record deleted because topic is null or an empty string:', this._id);
//         } catch (error) {
//             console.error('Error deleting record because topic is null or an empty string:', error);
//             return next(error);
//         }
//     }
//     next();
// });


// Define a post-save middleware to update the course stats after saving a Topic document
schema.post('save', async function (doc) {
    const Topic = this.constructor; // Get the model of the saved document
    const Task = mongoose.model('Task');

    try {
        const taskId = doc.task; // Get the ID of the task related to the saved topic

        // Find the task related to the current Topic
        const task = await Task.findById(taskId);

        if (task) {

            // Check if the newly created topic is already in the task's topics array
            const topicIndex = task.topics.indexOf(doc._id); // Assuming doc._id is the ID of the newly created topic

            if (topicIndex === -1) {
                // If the topic is not already present, add it to the task's topics array
                task.topics.push(doc._id);
                await task.save(); // Save the updated task
            }

             // Find all topics related to the current Task
            const topics = await Topic.find({ task: taskId });
            isOverDue = (dueDate) => {
                const dueDateConstructor = new Date(dueDate);
                const today = new Date();
                return dueDateConstructor < new Date(today.getFullYear(), today.getMonth(), today.getDate());
            }

            // Calculate the stats based on the status of topics
            const stats = {
                inProgress: topics.filter(topic => topic.status === TaskStatus.IN_PROGRESS && !isOverDue(topic.dueDate)).length,
                completed: topics.filter(topic => topic.status === TaskStatus.COMPLETED).length,
                notStarted: topics.filter(topic => topic.status === TaskStatus.NOT_STARTED).length,
                total: topics.length,
                overdue: topics.filter(topic => {
                    if (topic.status === TaskStatus.COMPLETED) {
                        return false;
                    }
                    return isOverDue(topic.dueDate);
                }).length,
                closedToday: topics.filter(topic => {
                    const postedDate = new Date(topic.postedDate);
                    const today = new Date();
                    return topic.status === TaskStatus.COMPLETED && postedDate.getDate() === today.getDate() &&
                           postedDate.getMonth() === today.getMonth() &&
                           postedDate.getFullYear() === today.getFullYear();
                }).length
            };
            if (stats.completed > 0) {
                task.status = stats.completed === stats.total ? TaskStatus.COMPLETED : TaskStatus.IN_PROGRESS;
            }

             // Update the taskStats field of the related Task document
             await Task.findByIdAndUpdate(taskId, { $set: { taskStats: stats, status: task.status } });
        }

    } catch (error) {
        console.error('Error updating topic stats in Task:', error);
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

module.exports = mongoose.model('Topic', schema);
