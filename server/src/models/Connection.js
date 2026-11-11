const mongoose = require('mongoose');

const { Schema } = mongoose;

const CONNECTION_STATUSES = ['pending', 'accepted', 'declined', 'cancelled'];

const connectionSchema = new Schema(
  {
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Sorted pair fields ensure duplicate prevention regardless of order
    userLow: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    userHigh: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: CONNECTION_STATUSES,
      default: 'pending',
      index: true,
    },
    message: { type: String, trim: true, maxlength: 500, default: '' },
    lastRequestedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Compound unique index on sorted user pair
connectionSchema.index({ userLow: 1, userHigh: 1 }, { unique: true });

// Pre-validate hook to populate userLow and userHigh
connectionSchema.pre('validate', function (next) {
  if (this.requester && this.recipient) {
    const r1 = this.requester.toString();
    const r2 = this.recipient.toString();
    if (r1 === r2) {
      return next(new Error('Cannot create a connection with yourself.'));
    }
    if (r1 < r2) {
      this.userLow = this.requester;
      this.userHigh = this.recipient;
    } else {
      this.userLow = this.recipient;
      this.userHigh = this.requester;
    }
  }
  next();
});

module.exports = mongoose.model('Connection', connectionSchema);
module.exports.CONNECTION_STATUSES = CONNECTION_STATUSES;
