const mongoose = require('mongoose');

const { Schema } = mongoose;

const emailVerificationTokenSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    token: { type: String, required: true, unique: true, index: true },
    collegeEmail: { type: String, required: true, trim: true, lowercase: true },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL auto-cleanup on expiry
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmailVerificationToken', emailVerificationTokenSchema);
