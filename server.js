// require('newrelic');
var express = require('express');
var bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const errorHandler = require('./api/_middleware/error-handler');
const config = require('./api/config/config');
// const messagingSystem = require('@lminc/distributed-messaging');
// const socket = require('socket.io');
// const redisAdapter = require('socket.io-redis');
const os = require('os');
const { DateTime } = require('luxon');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser());

// allow cors requests from any origin and with credentials
app.use(cors({ origin: (origin, callback) => callback(null, true), credentials: true }));

// api routes
app.use('/users', require('./api/users/users.controller'));
app.use('/university', require('./api/universities/university.controller'));
app.use('/courses', require('./api/courses/course.controller'));
app.use('/terms', require('./api/term/term.controller'));
app.use('/students', require('./api/students/student.controller'));
app.use('/tasks', require('./api/tasks/task.controller'));
app.use('/topics', require('./api/topics/topic.controller'));
app.use('/professors', require('./api/professors/professor.controller'));

// swagger docs route
if (config.env !== 'production') {
    console.log(`env: ${config.env}, loading swagger...`);
    app.use('/api-docs', require('./api/_helpers/swagger'));
}

// global error handler
app.use(errorHandler);

app.get('', function (req, res) {
    res.json({
        apiName: process.env.npm_package_name,
        apiVersion: process.env.npm_package_version,
        hostname: os.hostname(),
        startTime: DateTime.now()
            .minus(process.uptime() * 1000)
            .toLocaleString(DateTime.DATETIME_MED),
        uptime: Math.floor(process.uptime()) + 's'
    });
});

app.get('/*', function (req, res) {
    res.status(404).json();
});

// Initialize the app.
var server = app.listen(process.env.PORT || 3000, function () {
    var port = server.address().port;
    console.log('======= student-mentor-backend-services NOW RUNNING ON PORT:', port);
});

// const options = new messagingSystem.ConnectOptions(config.redis.url);
// const publisher = new messagingSystem.Publisher(options);
// const subscriber = new messagingSystem.Subscriber(options);

// const io = socket.listen(server);
// io.adapter(redisAdapter({ pubClient: publisher.getPublisher(), subClient: subscriber.getSubscriber() }));

// io.sockets.on('connection', () => {
//     console.log(`socket connection received`);
// });

// app.set(`ict-socket`, io);
