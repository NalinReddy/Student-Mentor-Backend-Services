const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const TaskStatus = require("../_helpers/task-status.type");
const {getCurrentWeek} = require("../_helpers/utils");

const schema = new Schema({
    studentId: {type: String, unique: true, trim: true, required: true},
    firstName: { type: String, unique: false, trim: true, required: true },
    lastName: { type: String, unique: false, trim: true, required: true },
    contactNumber: { type: String, unique: false, trim: true, required: true },
    personalEmail: { type: String, unique: true, required: true, trim: true },
    eduEmail: { type: String, trim: true },
    eduPassword: { type: String, trim: true },
    courseType: { type: Schema.Types.ObjectId, ref: 'CourseType' },
    // joiningDate: {type: Date, required: true},
    // assignedMentors: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    courses: [{ course: {type: Schema.Types.ObjectId, ref: 'Course'}, assignedMentors: [{ type: Schema.Types.ObjectId, ref: 'User' }] }],
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    tracking: {
        type: Object,
        required: true
    },
    active: {type: Boolean, required: true, default: true}
});

schema.index({ studentId: 1 });
schema.index({ firstName: 1, lastName: 1 });
schema.index({ firstName: "text", lastName: "text" });

// Define a post-save middleware to create a new Task after saving a Student document
schema.post('save', async function (doc) {
    try {
        const student = doc;
        const Task = mongoose.model('Task');
        // Populate course data in the student.courses array
        await mongoose.model('Student').populate(student, { path: 'courses.course', populate: {path: 'term'} });
        // Iterate over the courses of the student
        for (const courseData of student.courses) {
            const courseId = courseData.course.id;
            const assignedMentors = courseData.assignedMentors;
            // Add assigned mentors to the university if they are not already added
            const University = mongoose.model('University');
            const university = await University.findById(student.university);
            for (const mentor of assignedMentors) {
                if (!university.mentors.includes(mentor)) {
                    university.mentors.push(mentor);
                }
            }
            await university.save();
            
            console.log("course data", courseData?.course);
            let currentWeek = courseData?.course?.term?.startDate ? getCurrentWeek(courseData?.course?.term?.startDate) : 1;
            currentWeek = (currentWeek >= courseData?.course.termPeriod.startWeek && currentWeek <= courseData?.course.termPeriod.endWeek) ? currentWeek : 1; 

            if (assignedMentors?.length) {
                const existingTasks = await Task.find({ student: student._id, course: courseId });

                    if (!existingTasks?.length) {
                        console.log("**********************No existing Tasks, creating few**********************************");
                        console.log("currentWeek", currentWeek);
                        console.log("endWeek", courseData?.course?.termPeriod?.endWeek);
                        const tasks = [];
                        for (let i = currentWeek; i <= courseData?.course?.termPeriod?.endWeek; i++) {
                            tasks.push({
                                studentId: student.studentId,
                                student: student._id,
                                course: courseId,
                                university: student.university,
                                mentorAssigned: assignedMentors,
                                status: TaskStatus.NOT_STARTED,
                                tracking: student.tracking,
                                active: student.active,
                                week: i,
                                term: courseData?.course?.term?.id
                                // Include other relevant fields here
                            });
                        }
                        console.log(JSON.stringify(tasks));
                        // Create tasks in bulk
                        await Task.insertMany(tasks);

                } else {
                    console.log("Need to update if there is any change", assignedMentors, existingTasks[0].mentorAssigned);
                    if ( assignedMentors?.some(mentor => existingTasks[0].mentorAssigned?.indexOf(mentor) < 0) || assignedMentors?.length !== existingTasks[0].mentorAssigned?.length) {
                        // Update if there is any assigned Mentors changed.
                        const bulkOperations = existingTasks.map(existingTask => ({
                            updateOne: {
                                filter: { _id: existingTask._id },
                                update: {
                                    $set: {
                                        mentorAssigned: assignedMentors,
                                        'tracking.lastUpdatedDate': student?.lastUpdatedDate,
                                        'tracking.lastUpdatedBy': student?.lastUpdatedBy
                                        // Include other fields to update here
                                    }
                                }
                            }
                        }));
                        await Task.bulkWrite(bulkOperations);
                    }
                    

                    // Update if there is any assigned Mentors changed.
                    // if ( assignedMentors?.some(mentor => existingTask.mentorAssigned?.indexOf(mentor) < 0) || assignedMentors?.length !== existingTask.mentorAssigned?.length) {
                    //     existingTask.mentorAssigned = assignedMentors;
                    //     existingTask.tracking = existingTask.tracking;
                    //     existingTask.tracking.lastUpdatedDate = student?.lastUpdatedDate;
                    //     existingTask.tracking.lastUpdatedBy = student?.lastUpdatedBy;
                    //     await existingTask.save();
                    // }
                }
            }

            
        }
    } catch (error) {
        console.error('Error creating task:', error);
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

module.exports = mongoose.model('Student', schema);
