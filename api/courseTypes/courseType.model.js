const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: String, // Masters, PhD
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

module.exports = mongoose.model('CourseType', schema);
