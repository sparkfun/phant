var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var schema = new Schema({
  title: { type: String, index: true, required: true },
  description: String,
  tags: { type: [String], index: true },
  fields: { type: [String], required: true },
  location: {type: Object, index: true},
  date: { type: Date, default: Date.now, required: true },
  last_push: { type: Date, default: 0, required: true, index: true },
  hidden: { type: Boolean, default: false, required: true, index: true },
  flagged: { type: Boolean, default: false, required: true, index: true }
}, {
  strict: false,
  toObject: { virtuals: true }
});

module.exports = mongoose.model('Metadata', schema);
