const mongoose = require('mongoose');

const { Schema } = mongoose;

const NOTIFICATION_TYPES = [
  'team_request',
  'request_accepted',
  'request_declined',
  'announcement',
  'team_joined',
  'host_approval',
  'connection_request',
  'connection_accepted',
  'invitation',
  'idea_interest',
  'new_message',
  'team_changes',
];

const notificationSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, trim: true, maxlength: 1000 },
    read: { type: Boolean, default: false, index: true },
    type: { type: String, enum: NOTIFICATION_TYPES, required: true },
    link: { type: String, trim: true },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
