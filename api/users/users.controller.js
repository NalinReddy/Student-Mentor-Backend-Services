const express = require('express');
const router = express.Router();
const Joi = require('@hapi/joi');
const rateLimit = require("express-rate-limit");

const validateRequest = require('../_middleware/validate-request');
const authorize = require('../_middleware/authorize');
const Role = require('../_helpers/role');
const userService = require('./user.service');
const config = require('../config/config');
const utils = require('../_helpers/utils');

// Limit Api call rates to 10 per minute
const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: config.maxApiRateLimit,
  });


// routes
router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authorize(), revokeToken);
router.post('/register', registerSchema, register);
router.get('/verify-email/:token', limiter, verifyEmail);
router.get('/getLoggedInUserStats', authorize(), getLoggedInUserStats);
router.post('/forgot-password', limiter, forgotPasswordSchema, forgotPassword);
router.post('/validate-reset-token', limiter, validateResetTokenSchema, validateResetToken);
router.post('/reset-password', resetPasswordSchema, resetPassword);
router.get('/', authorize(), filterByQueryIfPassed, getAll);
router.get('/:id', authorize(), getById);
router.get('/:mentorId/members', authorize(), getMembersByMentorId);
router.post('/:mentorId/createMember', createMemberSchema, createMember);
// router.post('/', authorize([Role.Admin, Role.SuperAdmin, Role.GITSupportRole]), createSchema, create);
router.put('/:id', authorize([Role.Admin, Role.SuperAdmin, Role.GITSupportRole]), updateSchema, update);
router.delete('/:id', authorize([Role.Admin, Role.SuperAdmin, Role.GITSupportRole]), _delete);
router.put('/:id/toggle-active', authorize([Role.Admin, Role.SuperAdmin, Role.GITSupportRole]), toggleActivateUser);
router.put('/:id/settings', authorize([Role.Admin, Role.SuperAdmin, Role.GITSupportRole, Role.Broker, Role.Customer, Role.Dispatcher, Role.Driver]), updateUserSettingsSchema, updateUserSettings);


module.exports = router;

async function filterByQueryIfPassed(req, res, next) {
    if ('role' in req.query && !!req.query.role?.trim()?.length) {
        return await getAllUsersByRole(req, res, next);
    }
    next();
}

function authenticateSchema(req, res, next) {
    console.log(`entered UsersController.authenticateSchema`);
    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function authenticate(req, res, next) {
    console.log(`entered UsersController.authenticate`);
    console.log(`req body email ${req.body.email}`);
    const { email, password } = req.body;
    const ipAddress = req.ip;
    userService
        .authenticate({ email, password, ipAddress })
        .then(({ refreshToken, ...user }) => {
            setTokenCookie(res, refreshToken);
            console.log(`finished authen user`);
            res.json(user);
        })
        .catch((err) => {
            console.log(`error authenticating user: ${err}`);
            next(err);
        });
}

function getLoggedInUserStats(req, res, next) {
    console.log(`entered UsersController.getLoggedInUserStats`);
    userService
        .getLoggedInUserStats(req.user.id, req.query.university)
        .then((stats) => {
            res.json(stats);
        })
        .catch((err) => {
            console.log(`error getLoggedInUserStats: ${err}`);
            next(err);
        });
}

function refreshToken(req, res, next) {
    console.log(`entered UsersController.refreshToken`);
    const token = req.cookies.refreshToken;
    const ipAddress = req.ip;
    console.log("refresh token", token);
    userService
        .refreshToken({ token, ipAddress })
        .then(({ refreshToken, ...user }) => {
            setTokenCookie(res, refreshToken);
            res.json(user);
        })
        .catch(next);
}

function revokeTokenSchema(req, res, next) {
    console.log(`entered UsersController.revokeTokenSchema`);
    const schema = Joi.object({
        token: Joi.string().empty('')
    });
    validateRequest(req, next, schema);
}

function revokeToken(req, res, next) {
    console.log(`entered UsersController.revokeToken`);
    // accept token from request body or cookie
    const token = req.body.token || req.cookies.refreshToken;
    const ipAddress = req.ip;

    if (!token) return res.status(400).json({ message: 'Token is required' });

    // users can revoke their own tokens and admins can revoke any tokens
    if (!req.user.ownsToken(token) && !utils.isAdministrator(req.user.role)) {
        console.log('DEBUG: unauthorized 3');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    userService
        .revokeToken({ token, ipAddress })
        .then(() => res.json({ message: 'Token revoked' }))
        .catch(next);
}

function updateUserSettingsSchema(req, res, next) {
    const schema = Joi.object({
        settings: Joi.object({
            notifications: Joi.object({
                email: Joi.object({
                    orderDeliveredEnabled: Joi.boolean().when(req.user.role, {
                        is: Role.Customer,
                        then: Joi.boolean().required(),
                        otherwise: Joi.boolean()
                      }),
                      orderInTransitEnabled: Joi.boolean().when(req.user.role, {
                        is: Role.Customer,
                        then: Joi.boolean().required(),
                        otherwise: Joi.boolean()
                      }),
                      orderDispatchedEnabled: Joi.boolean().when(req.user.role, {
                        is: Role.Customer,
                        then: Joi.boolean().required(),
                        otherwise: Joi.boolean()
                      }),
                      orderRequestedEnabled: Joi.boolean().when(req.user.role, {
                        not: Role.Customer,
                        then: Joi.boolean().required(),
                        otherwise: Joi.boolean()
                      }),
                      orderRequestedAccepted: Joi.boolean().when(req.user.role, {
                        is: Role.Customer,
                        then: Joi.boolean().required(),
                        otherwise: Joi.boolean()
                      }),
                      orderRequestedCanceled: Joi.boolean().when(req.user.role, {
                        is: Role.Customer,
                        then: Joi.boolean().required(),
                        otherwise: Joi.boolean()
                      }),
                })
                    .disallow(null)
                    .required()
            })
                .disallow(null)
                .required()
        })
            .disallow(null)
            .required(),
        tracking: Joi.object().required()
    });
    validateRequest(req, next, schema);
}

function registerSchema(req, res, next) {
    console.log(`UsersController.registerSchema entered`);
    const rolesToCreate = [Role.Admin, Role.SuperAdmin, Role.Handler];
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        acceptTerms: Joi.boolean().valid(true).required(),
        role: Joi.string()
            .valid(...rolesToCreate)
            .empty('')
            .required(),
        tracking: Joi.object().required(),
        phones: Joi.array().allow(null)
    });
    validateRequest(req, next, schema);
}

function register(req, res, next) {
    console.log(`entered UsersController.register`);
    console.log(`UsersController.register origin: ${req.get('origin')}`);
    console.log(`UsersController.register req.body: ${JSON.stringify(req.body)}`);
    userService
        .register(req.body, req.get('origin'), req.user || {})
        .then(() => {
            res.json({ message: 'Registration successful, please check your email for verification instructions' });
        })
        .catch(next);
}

function createMemberSchema(req, res, next) {
    console.log(`UsersController.createMemberSchema entered`);
    const rolesToCreate = [Role.Member];
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().required(),
        role: Joi.string()
            .valid(...rolesToCreate)
            .empty('')
            .required(),
        tracking: Joi.object().required(),
        phones: Joi.array().allow(null)
    });
    validateRequest(req, next, schema);
}

function createMember(req, res, next) {
    console.log(`entered UsersController.createMember`);
    console.log(`UsersController.createMember origin: ${req.get('origin')}`);
    console.log(`UsersController.createMember req.body: ${JSON.stringify(req.body)}`);
    userService
        .createMember(req.body, req.params.mentorId, req.ip, req.user || {})
        .then(() => {
            res.json({ message: 'Registration successful, please check your email for verification instructions' });
        })
        .catch(next);
}

function verifyEmailSchema(req, res, next) {
    console.log(`entered UsersController.verifyEmailSchema`);
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function verifyEmail(req, res, next) {
    console.log(`entered UsersController.verifyEmail`);
    userService
        .verifyEmail(req.params.token)
        .then(() =>
            res.format({
                html: function () {
                    res.send(
                        `<h2>Verification successful. Please <a href="${config.appLoginUrl}">sign in.</a></h2>`
                    );
                }
            })
        )
        .catch(next);
}

function forgotPasswordSchema(req, res, next) {
    console.log(`entered UsersController.forgotPasswordSchema`);
    const schema = Joi.object({
        email: Joi.string().email().required()
    });
    validateRequest(req, next, schema);
}

function forgotPassword(req, res, next) {
    console.log(`entered UsersController.forgotPassword`);
    userService
        .forgotPassword(req.body, req.get('origin'))
        .then(() => res.json({ message: 'Please check your email for password reset instructions' }))
        .catch(next);
}

function validateResetTokenSchema(req, res, next) {
    console.log(`entered UsersController.validateResetTokenSchema`);
    const schema = Joi.object({
        token: Joi.string().required()
    });
    validateRequest(req, next, schema);
}

function validateResetToken(req, res, next) {
    console.log(`entered UsersController.validateResetToken`);
    userService
        .validateResetToken(req.body)
        .then(() => res.json({ message: 'Token is valid' }))
        .catch(next);
}

function resetPasswordSchema(req, res, next) {
    console.log(`entered UsersController.resetPasswordSchema`);
    const schema = Joi.object({
        token: Joi.string().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required()
    });
    validateRequest(req, next, schema);
}

function resetPassword(req, res, next) {
    console.log(`entered UsersController.resetPassword`);
    userService
        .resetPassword(req.body)
        .then(() => res.json({ message: 'Password reset successful, you can now login' }))
        .catch(next);
}

function getAll(req, res, next) {
    console.log(`UsersController.getAll entered`);
    userService
        .getAll(req.user, req.query)
        .then((users) => {
            return res.json(users);
        })
        .catch(next);
}

function getMembersByMentorId(req, res, next) {
    console.log(`UsersController.getMembersByMentorId entered`);
    userService
        .getMembersByMentorId(req.user, req.params.mentorId)
        .then((users) => {
            return res.json(users);
        })
        .catch(next);
}

function getById(req, res, next) {
    console.log(`entered UsersController.getById`);
    // users can get their own user and admins can get any user
    if (req.params.id !== req.user.id && !utils.isAdministrator(req.user.role) && req.user.role !== Role.GITSupportRole) {
        console.log('DEBUG: unauthorized 4');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    userService
        .getById(req.params.id)
        .then((user) => (user ? res.json(user) : res.sendStatus(404)))
        .catch(next);
}

function getAllUsersByRole(req, res, next) {
    console.log(`entered UsersController.getAllUsersByRole`);
    let rolesArr = req.query.role.indexOf(',') > 0 ? req.query.role.split(",") : [req.query.role];
    if (!rolesArr.every(role => !!Role[utils.getKeyFromValue(Role, role)])) {
        res.status(400).json({message: "BadRequest: Unsupported role value, please try again."})
        return;
    }
    if (rolesArr.some(role => Role[utils.getKeyFromValue(Role, role)] === Role.GITSupportRole) && req.user.role !== Role.GITSupportRole) {
        res.status(401).json({message: "Forbidden: You are not allowed to perform this action"})
        return;
    }
    return userService
        .getAllUsersByRole(rolesArr.map(role => Role[utils.getKeyFromValue(Role, role)]), req.user.role === Role.GITSupportRole ? req.body.truckerId : req.user.truckerId, req.user.role === Role.GITSupportRole)
        .then((users) => res.json(users || []))
        .catch(next);
}

function createSchema(req, res, next) {
    console.log(`entered UsersController.createSchema`);
    if (req.body.role === Role.GITSupportRole && req.user.role !== Role.GITSupportRole) {
        throw "You are not allowed to perform this action.";
    }
    const schema = Joi.object({
        title: Joi.string().required(),
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).required(),
        confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
        role: Joi.string().valid(Role.Admin, Role.SuperAdmin, Role.Dispatcher, Role.Customer).empty('').required(),
        customer: Joi.object().allow(null),
        company: Joi.object().allow(null),
        tracking: Joi.object().required(),
        phones: Joi.array().allow(null),
        brokerId: Joi.string().allow(null),
        customerId: Joi.string().allow(null),
        truckerId: Joi.string().allow(null),
    });
    validateRequest(req, next, schema);
}

function create(req, res, next) {
    console.log(`entered UsersController.create`);
    userService
        .create(req.body, req.user)
        .then((user) => res.json(user))
        .catch(next);
}

function updateSchema(req, res, next) {
    console.log(`entered UsersController.updateSchema`);
    // if user is not admim or superAdmin
    if (!utils.isAdministrator(req.user.role)) {
        throw `You are not authorized to perform this action`;
    }
    const schemaRules = {
        title: Joi.string().empty(''),
        firstName: Joi.string().empty(''),
        lastName: Joi.string().empty(''),
        email: Joi.string().email().empty(''),
        password: Joi.string().min(6).empty(''),
        confirmPassword: Joi.string().valid(Joi.ref('password')).empty(''),
        customer: Joi.object().allow(null),
        company: Joi.object().allow(null),
        tracking: Joi.object(),
        phones: Joi.array().allow(null),
        brokerId: Joi.string().allow(null),
        customerId: Joi.string().allow(null),
        truckerId: Joi.string().allow(null),
    };

    // only admins can update role && Value of role to 'SuperAdmin' can be updated only by a SuperAdmin
    if (utils.isAdministrator(req.user.role)) {
        if (req.body.role === Role.SuperAdmin && req.user.role !== Role.SuperAdmin) {
            throw "You are not allowed to perform this action.";
        }
        if (req.body.role === Role.Admin && (req.user.role !== Role.Admin && req.user.role !== Role.SuperAdmin)) {
            throw "You are not allowed to perform this action.";
        }
        const rolesToCreate = [Role.Admin, Role.SuperAdmin, Role.Student, Role.Handler, Role.Member];
        schemaRules.role = Joi.string()
            .valid(...rolesToCreate)
            .empty('');
    }

    const schema = Joi.object(schemaRules).with('password', 'confirmPassword');
    validateRequest(req, next, schema);
}

async function update(req, res, next) {
    console.log(`entered UsersController.update`);

    // users can update their own user and admins can update any user
    if (req.params.id !== req.user.id && !utils.isAdministrator(req.user.role)) {
        console.log('DEBUG: unauthorized 5');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    userService
        .update(req)
        .then((user) => res.json(user))
        .catch(next);
}

function _delete(req, res, next) {
    console.log(`entered UsersController._delete`);
    // users can delete their own user and admins can delete any user
    if (req.params.id !== req.user.id && !utils.isAdministrator(req.user.role) && req.user.role !== Role.GITSupportRole) {
        console.log('DEBUG: unauthorized 6');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    userService
        .delete(req)
        .then(() => res.json({ message: 'User deleted successfully' }))
        .catch(next);
}

function toggleActivateUser(req, res, next) {
    console.log(`entered UsersController.toggleActivateUser`);
    // users can't deactive their own user account and admins can deactive any user
    if (req.params.id !== req.user.id && !utils.isAdministrator(req.user.role) && req.user.role !== Role.GITSupportRole) {
        console.log('DEBUG: unauthorized 6');
        return res.status(401).json({ message: 'Unauthorized' });
    }

    userService
        .toggleActivateUser(req)
        .then(() => res.json({ message: `User ${ req.body.active ? 'activated' : 'deactivated' } successfully` }))
        .catch(next);
}

function updateUserSettings(req, res, next) {
    console.log(`entered UsersController.updateUserSettings`);

    userService
        .updateUserSettings(req)
        .then((user) => res.json(user))
        .catch(next);
}

// helper functions

function setTokenCookie(res, token) {
    console.log(`entered UsersController.setTokenCookie`);
    // create cookie with refresh token that expires in 7 days
    const cookieOptions = {
        httpOnly: true,
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        sameSite: 'none',
        secure: true
    };
    res.cookie('refreshToken', token, cookieOptions);
    console.log(`exiting UsersController.setTokenCookie`);
}
