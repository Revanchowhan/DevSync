const mongoose = require('mongoose');

const { Schema } = mongoose;

const PREFERRED_ROLES = ['Developer', 'Designer', 'Data Scientist', 'Researcher', 'Presenter'];

const interestedMemberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, trim: true, maxlength: 500, default: '' },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined'],
    default: 'pending',
    index: true,
  },
  createdAt: { type: Date, default: Date.now },
});

const ideaMemberSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, trim: true, default: 'Member' },
  joinedAt: { type: Date, default: Date.now },
});

const ideaSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 100, index: true },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    domain: { type: String, required: true, trim: true, maxlength: 50, index: true },
    requiredSkills: {
      type: [{ name: { type: String, required: true, trim: true } }],
      default: [],
    },
    preferredRoles: {
      type: [String],
      enum: PREFERRED_ROLES,
      default: ['Developer'],
    },
    teamSize: { type: Number, min: 2, max: 10, default: 4 },
    hackathon: { type: Schema.Types.ObjectId, ref: 'Hackathon', default: null, index: true },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
      index: true,
    },
    interested: { type: [interestedMemberSchema], default: [] },
    members: { type: [ideaMemberSchema], default: [] },
    convertedTeam: { type: Schema.Types.ObjectId, ref: 'Team', default: null },
  },
  { timestamps: true }
);

ideaSchema.index({ title: 'text', description: 'text', domain: 'text' });
ideaSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Idea', ideaSchema);
