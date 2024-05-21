const config = require('../config/config');
const mongoose = require('mongoose');

const connectionOptions = {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false
};

mongoose.connection.on('error', (err) => {
    console.error(`Error connecting to database: ${err}`);
});

mongoose.connection.on('connected', (err) => {
    console.log(`Connected to database.`);
});

mongoose.connect(process.env.MONGO_DB_URI || config.connectionString, connectionOptions);

mongoose.Promise = global.Promise;

module.exports = {
    User: require('../users/user.model'),
    MentorTasksStats: require('../users/mentor-tasks-stats.model'),
    Member: require('../users/member.model'),
    RefreshToken: require('../users/refresh-token.model'),
    Student: require('../students/student.model'),
    StudentFormData: require('../students/student-form-data.model'),
    Course: require('../courses/course.model'),
    Term: require('../term/term.model'),
    CourseTypes: require('../courseTypes/courseType.model'),
    Professor: require('../professors/professor.model'),
    Task: require('../tasks/task.model'),
    TopicLookupCategory: require('../topics/topic.lookup.categories.model'),
    Topic: require('../topics/topic.model'),
    TopicLookup: require('../topics/topic.lookup.model'),
    University: require('../universities/university.model'),
    isValidId
};

function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}
