const mongoose = require('mongoose');

const { Schema } = mongoose;

const conversationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['direct', 'team'],
      required: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    // For direct conversations: sorted pair "minId_maxId" to guarantee uniqueness
    participantsKey: {
      type: String,
      sparse: true,
      unique: true,
      index: true,
    },
    team: {
      type: Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    lastMessageText: {
      type: String,
      trim: true,
      default: '',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastMessageSender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    lastRead: [
      {
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        lastReadAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

conversationSchema.index({ participants: 1, lastMessageAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
