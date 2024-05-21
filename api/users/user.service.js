const config = require('../config/config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
// const sendEmail = require('../_helpers/send-email');
const db = require('../_helpers/db');
const Role = require('../_helpers/role');
const moment = require('moment');
const confirmEmail = require('../_helpers/confirm-email');
const passwordResetEmail = require('../_helpers/emails/password-reset-email');
const utils = require('../_helpers/utils');
const { ObjectID } = require('mongodb');
const TaskStatus = require("../_helpers/task-status.type");

module.exports = {
    authenticate,
    refreshToken,
    revokeToken,
    register,
    createMember,
    verifyEmail,
    forgotPassword,
    validateResetToken,
    resetPassword,
    getAll,
    getMembersByMentorId,
    getById,
    create,
    update,
    delete: _delete,
    toggleActivateUser: toggleActivateUser,
    getAllUsersByRole,
    getLoggedInUserStats
};

async function authenticate({ email, password, ipAddress }) {
    console.log('entered UserService.authenticate');
    const user = await db.User.findOne({ email, active: true });

    console.log(`UserService.authenticate user: ${user?.email}`);
    if (!user || !user.isVerified || !bcrypt.compareSync(password, user.passwordHash)) {
        if(user && !user.isVerified) {
        console.log(`UserService.authenticate email verification pending`);
            throw `Please verify your email address.`;
        }
        console.log(`UserService.authenticate incorrect creds`);
        throw 'Email or password is incorrect';
    }

    console.log(`UserService.authenticate generate token`);
    // set login date
    user.lastLogin = moment().toISOString(); // deprecate
    if (!user.tracking) {
        user.tracking = {};
    }
    user.tracking.lastLoginDate = moment().toISOString();
    await user.save();

    // authentication successful so generate jwt and refresh tokens
    const jwtToken = generateJwtToken(user);
    const refreshToken = generateRefreshToken(user, ipAddress);

    console.log(`UserService.authenticate save token`);
    // save refresh token
    await refreshToken.save();

    // return basic details and tokens
    return {
        ...basicDetails(user),
        jwtToken,
        refreshToken: refreshToken.token
    };
}

async function refreshToken({ token, ipAddress }) {
    console.log('entered UserService.refreshToken');
    const refreshToken = await getRefreshToken(token);
    const { user } = refreshToken;

    // replace old refresh token with a new one and save
    const newRefreshToken = generateRefreshToken(user, ipAddress);
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    refreshToken.replacedByToken = newRefreshToken.token;
    await refreshToken.save();
    await newRefreshToken.save();

    // generate new jwt
    const jwtToken = generateJwtToken(user);

    // return basic details and tokens
    return {
        ...basicDetails(user),
        jwtToken,
        refreshToken: newRefreshToken.token
    };
}

async function revokeToken({ token, ipAddress }) {
    console.log('entered UserService.revokeToken');
    const refreshToken = await getRefreshToken(token);

    // revoke token and save
    refreshToken.revoked = Date.now();
    refreshToken.revokedByIp = ipAddress;
    await refreshToken.save();
}

async function register(params, origin, loggedInUser) {
    console.log('entered UserService.register');
    // validate
    if (await db.User.findOne({ email: params.email })) {
        console.log("User with given email address already there in the system.")
        // send already registered error in email to prevent user enumeration
        // return await sendAlreadyRegisteredEmail(params.email, origin);
        throw 'User with given email address already there in the system.';
    }

    // create user object
    const user = new db.User(params);

    // first registered user is an admin
    const isFirstUser = (await db.User.countDocuments({})) === 0;
    if (isFirstUser) {
        user.role = Role.SuperAdmin;
    }

    if (!user.role) {
        user.role = params.role;
    }

    user.verificationToken = randomTokenString();

    // hash password
    if (params.password) {
        user.passwordHash = hash(params.password);
    }

    user.tracking.createdDate = moment().toISOString();

    // save user
    await user.save();

    // send email
    // await sendVerificationEmail(user, origin);
}

async function createMember(params, mentorID, ip, loggedInUser) {
    console.log('entered UserService.createMember');
    // validate
    if (await db.Member.findOne({ email: params.email })) {
        console.log("User with given email address already there in the system.")
        // send already createMembered error in email to prevent user enumeration
        // return await sendAlreadycreateMemberedEmail(params.email, ip);
        throw 'User with given email address already there in the system.';
    }

    // create user object
    const user = new db.Member(params);
    user.teamleaderMentorID = mentorID;

    if (!user.role) {
        user.role = params.role;
    }

    user.verificationToken = randomTokenString();

    // hash password
    if (params.password) {
        user.passwordHash = hash("23434@#@#$@#534tfsdf~#@$@^%&5dSFsdfewew$$#%@#$");
    }

    user.tracking.createdDate = moment().toISOString();
    user.tracking.createdBy =  loggedInUser.firstName + ' ' + loggedInUser.lastName;
    user.tracking.ipAddress = ip;

    // save user
    await user.save();

    // send email
    // await sendVerificationEmail(user, ip);
}

async function verifyEmail(token) {
    console.log('entered UserService.verifyEmail');
    const user = await db.User.findOne({ verificationToken: token });

    if (!user) throw 'Verification failed';

    user.verified = Date.now();
    user.verificationToken = undefined;
    await user.save();
}

async function forgotPassword({ email }, origin) {
    console.log('entered UserService.forgotPassword');
    const user = await db.User.findOne({ email });

    // always return ok response to prevent email enumeration
    if (!user) return;

    // create reset token that expires after 24 hours
    user.resetToken = {
        token: generateRandomSixDigitCode(),
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
    await user.save();

    // send email
    await sendPasswordResetEmail(user, origin);
}

async function validateResetToken({ token }) {
    console.log('entered UserService.validateResetToken');
    const user = await db.User.findOne({
        'resetToken.token': token,
        'resetToken.expires': { $gt: Date.now() }
    });

    if (!user) throw 'Invalid token';
}

async function resetPassword({ token, password }) {
    console.log('entered UserService.resetPassword');
    const user = await db.User.findOne({
        'resetToken.token': token?.trim(),
        'resetToken.expires': { $gt: Date.now() }
    });

    if (!user) throw 'Invalid code. Please try again.';

    // update password and remove reset token
    user.passwordHash = hash(password);
    user.passwordReset = Date.now();
    user.resetToken = undefined;
    await user.save();
}

async function getMembersByMentorId(user, mentorId) {
    console.log(`UserService.getMembersByMentorId entered ${JSON.stringify(mentorId)}`);
    let users = [];
    users = await db.Member.find({ 
        teamleaderMentorID :
        mentorId});
    return users;
}

async function getLoggedInUserStats(loggedInUserId, university) {
    console.log(`UserService.getLoggedInUserStats entered for user: ${loggedInUserId}`);

    const mentorAssigned = loggedInUserId; // Get the IDs of the mentors related to the saved task

    try {
        // Find all tasks related to the current Mentor
        const tasks = await db.Task.find({ university, mentorAssigned: { $in: [mentorAssigned] } });

        // Calculate the stats based on the status of tasks
        const stats = {
            inProgress: tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length,
            completed: tasks.filter(task => task.status === TaskStatus.COMPLETED).length,
            notStarted: tasks.filter(task => task.status === TaskStatus.NOT_STARTED).length,
            total: tasks.length
        };

        // Initialize topicStats
        let topicStats = { inProgress: 0, completed: 0, notStarted: 0, total: 0, overdue: 0, closedToday: 0 };
        
        // Calculate topicStats from each task
        tasks.forEach(task => {
            topicStats.inProgress += task.taskStats.inProgress;
            topicStats.completed += task.taskStats.completed;
            topicStats.notStarted += task.taskStats.notStarted;
            topicStats.total += task.taskStats.total;
            topicStats.closedToday += task.taskStats.closedToday;
            topicStats.overdue += task.taskStats.overdue;
        });

        // Update or create the MentorTasksStats document
        let mentorTaskStats = await db.MentorTasksStats.findOne({ mentor: loggedInUserId });
        if (!mentorTaskStats) {
            mentorTaskStats = new db.MentorTasksStats({
                mentor: loggedInUserId,
                taskStats: stats,
                topicStats: topicStats
            });
            await mentorTaskStats.save();
        } else {
            mentorTaskStats.taskStats = stats;
            mentorTaskStats.topicStats = topicStats;
            await mentorTaskStats.save();
        }

        // Fetch the updated MentorTasksStats document and return the result with newTasksCount
        const result = await db.MentorTasksStats.findOne({ mentor: loggedInUserId });
        return result;

    } catch (error) {
        console.error(`Error in getLoggedInUserStats: ${error}`);
        throw error;
    }
}

async function getAll(user, params) {
    console.log(`UserService.getAll entered ${JSON.stringify(params)}`);
    let users = [];
    users = await db.User.find();
    // if (user.truckerId) {
    //     users = await db.User.find({ truckerId: user.truckerId });
    // } else if (user.role === Role.GITSupportRole) {
    //     users = await db.User.find({ truckerId: params.truckerId });
    // }
    return users.map((x) => basicDetails(x));
}

async function getAllUsersByRole(roleArr) {
    console.log('entered UserService.getAllUsersByRole', roleArr);
    const query = { role: { $in: roleArr }, active: true };
    const users = await db.User.find(query);
    return users.map(basicDetails);
}

async function getById(id) {
    console.log('entered UserService.getById');
    const user = await getUser(id);
    return basicDetails(user);
}

async function create(params, loggedInUser) {
    console.log('entered UserService.create');
    // validate
    if (await db.User.findOne({ email: params.email })) {
        throw 'Email "' + params.email + '" is already registered';
    }
    // Customers & Brokers are only created by user with role as GitSupportRole
    if ((params.role === Role.Customer || params.role === Role.Broker) && loggedInUser.role !== Role.GITSupportRole) {
        throw 'Sorry, you cannot create customer & broker. Contact GIT Support team for assistance.';
    }
    const user = new db.User(params);
    user.verified = Date.now();
    if (params.role === Role.Customer && params.customerId) {
        user.truckerId = null;
        user.brokerId = null;
    } else if (
        params.role === Role.Admin ||
        params.role === Role.SuperAdmin ||
        params.role === Role.Dispatcher ||
        params.role === Role.Driver
    ) {
        user.truckerId = loggedInUser.truckerId;
        user.brokerId = null;
        user.customerId = null;
    }

    // hash password
    if (params.password) {
        user.passwordHash = hash(params.password);
    }

    // save user
    await user.save();

    return basicDetails(user);
}

async function update(req) {
    console.log('entered UserService.update');
    const id = req.params.id;
    const params = req.body;
    const user = await getUser(id);

    // if is invoked from update api & invoked by an admin, he cannot edit other admin/superAdmins but can edit his own record
    if (
        req.route.methods.put &&
        req.route.path === '/:id' &&
        req.user.role === Role.Admin &&
        (user.role === Role.Admin || user.role === Role.SuperAdmin) &&
        user.id !== req.user.id
    ) {
        throw 'You are not allowed to perform this action.';
    }

    // validate
    if (user.email !== params.email && (await db.User.findOne({ email: params.email }))) {
        throw 'Email "' + params.email + '" is already taken';
    }
    // hash password if it was entered
    if (params.password) {
        user.passwordHash = hash(params.password);
        delete params.password;
    }

    // add tracking data
    params.tracking = params.tracking || {};

    // merge the tracking
    params.tracking = { ...user.tracking, ...params.tracking };

    params.tracking.lastUpdatedDate = moment().toISOString();

    // get user performing the update
    const updatedByUser = await getUser(req.user.id);
    params.tracking.lastUpdatedBy = updatedByUser.firstName + ' ' + updatedByUser.lastName;

    // copy params to user and save
    Object.assign(user, params);
    await user.save();

    return basicDetails(user);
}

async function toggleActivateUser(req) {
    const user = await getUser(req.params.id);
    // An admin, he cannot delete other admin/superAdmins/GitSupport and cannot delete his own record
    if (
        ( req.user.role === Role.Admin && (user.role === Role.Admin || user.role === Role.SuperAdmin || user.role === Role.GITSupportRole) ) ||
        user.id === req.user.id
    ) {
        throw 'You are not allowed to perform this action.';
    }
    // A SuperAdmin, he cannot delete a GitSupport and cannot delete his own record
    if (
        ( req.user.role === Role.SuperAdmin && user.role === Role.GITSupportRole ) ||
        user.id === req.user.id
    ) {
        throw 'You are not allowed to perform this action.';
    }
   // add tracking data
   const updatedByUser = req.user;
   user.tracking = user.tracking || {};
   user.tracking.lastUpdatedDate = moment().toISOString();
   user.tracking.lastUpdatedBy = updatedByUser.firstName + ' ' + updatedByUser.lastName;

   user.active = req.body.active;
   await user.save();
}

async function _delete(req) {
    console.log('entered UserService._delete');
    const user = await getUser(req.params.id);
    // if is invoked from delete api & invoked by an admin, he cannot delete other admin/superAdmins and cannot delete his own record
    if (
        (req.route.methods.delete &&
            req.route.path === '/:id' &&
            req.user.role === Role.Admin &&
            (user.role === Role.Admin || user.role === Role.SuperAdmin || user.role === Role.GITSupportRole)) ||
        user.id === req.user.id
    ) {
        throw 'You are not allowed to perform this action.';
    }
     // A SuperAdmin, he cannot delete a GitSupport and cannot delete his own record
     if (
        ( req.user.role === Role.SuperAdmin && user.role === Role.GITSupportRole ) ||
        user.id === req.user.id
    ) {
        throw 'You are not allowed to perform this action.';
    }
    // add tracking data
    const deletedByUser = req.user;
    user.tracking = user.tracking || {};
    user.tracking.lastUpdatedDate = moment().toISOString();
    user.tracking.lastUpdatedBy = deletedByUser.firstName + ' ' + deletedByUser.lastName;

    user.active = false;
    await user.save();
}

// helper functions

async function getUser(id) {
    console.log('entered UserService.getUser');
    if (!db.isValidId(id)) throw 'User not found';
    const user = await db.User.findById(id);
    if (!user) throw 'User not found';
    return user;
}

async function getRefreshToken(token) {
    console.log('entered UserService.getRefreshToken');
    const refreshToken = await db.RefreshToken.findOne({ token }).populate('user');
    if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
    return refreshToken;
}

function hash(password) {
    console.log('entered UserService.hash');
    return bcrypt.hashSync(password, 10);
}

function generateJwtToken(user) {
    console.log('entered UserService.generateJwtToken');
    let expires = '7d';
    return jwt.sign({ username: user.email, sub: user.id, id: user.id }, config.secret, { expiresIn: expires });
}

function generateRefreshToken(user, ipAddress) {
    console.log('entered UserService.generateRefreshToken');
    // create a refresh token that expires in 7 days
    return new db.RefreshToken({
        user: user.id,
        token: randomTokenString(),
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdByIp: ipAddress
    });
}

function randomTokenString() {
    console.log('entered UserService.randomTokenString');
    return crypto.randomBytes(40).toString('hex');
}

function generateRandomSixDigitCode() {
    console.log('entered UserService.generateRandomSixDigitCode');
    return Math.floor(100000 + Math.random() * 900000);
}

function basicDetails(user) {
    console.log('UserService.basicDetails entered');
    const {
        id,
        title,
        firstName,
        lastName,
        email,
        tracking,
        role,
        created,
        updated,
        isVerified,
        lastLogin,
        phones,
        active
    } = user;
    return {
        id,
        title,
        firstName,
        lastName,
        email,
        tracking,
        role,
        created,
        updated,
        isVerified,
        lastLogin,
        phones,
        active
    };
}

// TODO: revisit origin
async function sendVerificationEmail(user, origin) {
    console.log('entered UserService.sendVerificationEmail');
    console.log(`UserService.sendVerificationEmail origin: ${origin}`);
    console.log(`UserService.sendVerificationEmail config api url: ${config.apiUrl}`);
    let host;
    // TODO: revisit if correct strategy
    // if (origin) {
    //     host = origin;
    // } else {
    host = config.apiUrl;
    // }

    const verifyUrl = `${host}/users/verify-email/${user.verificationToken}`;
    await confirmEmail(user.email, user.firstName, verifyUrl);
}
// TODO: look into why origin not always available
async function sendAlreadyRegisteredEmail(email, origin) {
    console.log('entered UserService.sendAlreadyRegisteredEmail');
    let message;
    if (origin) {
        message = `<p>If you don't know your password please visit the <a href="${origin}/user/forgot-password">forgot password</a> page.</p>`;
    } else {
        message = `<p>If you don't know your password you can reset it via the <code>/user/forgot-password</code> api route.</p>`;
    }

    // await sendEmail({
    //     to: email,
    //     subject: 'Sign-up - Email Already Registered',
    //     html: `<h4>Email Already Registered</h4>
    //            <p>Your email <strong>${email}</strong> is already registered.</p>
    //            ${message}`
    // });
}

async function sendPasswordResetEmail(user, origin) {
    console.log('entered UserService.sendPasswordResetEmail');
    await passwordResetEmail(user.email, user.resetToken.token);
}