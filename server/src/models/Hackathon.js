const mongoose = require('mongoose');

const { Schema } = mongoose;

const hackathonSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    bannerUrl: { type: String, trim: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date, required: true, index: true },
    teamFormationDeadline: { type: Date, required: true },
    mode: { type: String, enum: ['online', 'offline'], default: 'online' },
    venue: { type: String, trim: true },
    prize: { type: String, trim: true },
    teamSizeLimit: { type: Number, default: 4, min: 1, max: 20 },
    requiredSkills: { type: [String], default: [], index: true },
    host: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    participants: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [] },
    // per-user registration timestamps (keyed by user id string)
    participantMeta: { type: Map, of: Date, default: {} },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

hackathonSchema.index({ host: 1, registrationDeadline: 1 });

hackathonSchema.methods.computedStatus = function computedStatus(now = new Date()) {
  return !this.isOpen || now > this.registrationDeadline ? 'closed' : 'open';
};

module.exports = mongoose.model('Hackathon', hackathonSchema);
