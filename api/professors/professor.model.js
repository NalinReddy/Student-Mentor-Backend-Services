const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    title: {type: String, trim: true, required: true},
    firstName: { type: String, unique: false, trim: true, required: true },
    lastName: { type: String, unique: false, trim: true, required: true },
    email: { type: String, trim: true },
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
    tracking: {
        type: Object,
        required: true
    },
    active: {type: Boolean, required: true, default: true}
});

schema.index({ contactFirstName: 1, contactLastName: 1 });

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        // delete ret.markedAsDeleted;
    }
});

module.exports = mongoose.model('Professor', schema);
