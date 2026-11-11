const mongoose = require('mongoose');

const { Schema } = mongoose;

const teamRequestSchema = new Schema(
  {
    team: { type: Schema.Types.ObjectId, ref: 'Team', required: true, index: true },
    fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // 'invite': a member invites toUser to join. 'join': fromUser asks toUser (owner) to join.
    kind: {
      type: String,
      enum: ['invite', 'join'],
      default: 'invite',
      index: true,
    },
    message: { type: String, trim: true, maxlength: 500 },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate *pending* requests:
// - invites: one pending invite per (team, invited user), whoever sent it
// - joins: one pending join request per (team, requester)
teamRequestSchema.index(
  { team: 1, toUser: 1 },
  { unique: true, partialFilterExpression: { status: 'pending', kind: 'invite' } }
);
teamRequestSchema.index(
  { team: 1, fromUser: 1 },
  { unique: true, partialFilterExpression: { status: 'pending', kind: 'join' } }
);

module.exports = mongoose.model('TeamRequest', teamRequestSchema);
