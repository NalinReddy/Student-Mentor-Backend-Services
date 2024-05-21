const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    student: {type: mongoose.Schema.Types.ObjectId, ref: 'Student'},
    email: String,
    phone: String,
    country: String,
    language: String,
    universityLoginUrl: String,
    MFAQ1: String,
    Answer1: String,
    MFAQ2: String,
    Answer2: String,
    MFAQ3: String,
    Answer3: String,
    MFAQ4: String,
    Answer4: String,
    university: { type: Schema.Types.ObjectId, ref: 'University', required: true },
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

module.exports = mongoose.model('StudentFormData', schema);
