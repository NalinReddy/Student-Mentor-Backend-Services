const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    name: String,
    category: {type: Schema.Types.ObjectId, ref: "TopicLookupCategory" },
    tracking: {
        type: Object,
        required: true
    },
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

module.exports = mongoose.model('TopicLookup', schema);
