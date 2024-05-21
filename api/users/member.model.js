const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Role = require('../_helpers/role');

// For Admin, SuperAdmin, Handler
const schema = new Schema({
    email: { type: String, unique: true, required: true },
    teamleaderMentorID: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    passwordHash: { type: String },
    title: { type: String, required: true },
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, required: true, index: true },
    acceptTerms: Boolean,
    role: { type: String, required: true, default: Role.Member },
    verificationToken: String,
    verified: Date,
    resetToken: {
        token: String,
        expires: Date
    },
    passwordReset: Date,
    created: { type: Date, default: Date.now },
    updated: Date,
    lastLogin: { type: String },
    tracking: {
        type: Object,
        required: true
    },
    phones: {
        type: []
    },
    active: { type: Boolean, required: true, default: true }
});

schema.virtual('isVerified').get(function () {
    return !!(this.verified || this.passwordReset);
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        delete ret.passwordHash;
    }
});

module.exports = mongoose.model('Member', schema);
