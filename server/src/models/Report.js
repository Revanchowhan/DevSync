const mongoose = require('mongoose');

const { Schema } = mongoose;

const REPORT_REASONS = [
  'spam',
  'harassment',
  'inappropriate_content',
  'fake_profile',
  'other',
];

const reportSchema = new Schema(
  {
    reporter: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    target: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reason: {
      type: String,
      enum: REPORT_REASONS,
      required: true,
    },
    details: { type: String, trim: true, maxlength: 1000, default: '' },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, target: 1 });

module.exports = mongoose.model('Report', reportSchema);
module.exports.REPORT_REASONS = REPORT_REASONS;
