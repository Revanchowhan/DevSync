const mongoose = require('mongoose');

const { Schema } = mongoose;

const taskSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, trim: true, maxlength: 1000, default: '' },
  assignee: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['todo', 'in_progress', 'done'],
    default: 'todo',
    index: true,
  },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const linkSchema = new Schema({
  title: { type: String, required: true, trim: true, maxlength: 100 },
  url: { type: String, required: true, trim: true, maxlength: 500 },
  addedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
});

const teamSchema = new Schema(
  {
    hackathon: { type: Schema.Types.ObjectId, ref: 'Hackathon', index: true, default: null },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, trim: true, maxlength: 1000 },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: { type: [{ type: Schema.Types.ObjectId, ref: 'User' }], default: [], index: true },
    maxMembers: { type: Number, default: 5, min: 2, max: 10 },
    missingSkills: {
      type: [{ name: { type: String, required: true, trim: true } }],
      default: [],
      validate: {
        validator: (v) => v.length <= 10,
        message: 'missingSkills cannot exceed 10 entries',
      },
    },
    isOpen: { type: Boolean, default: true },
    joinCode: { type: String, unique: true, sparse: true, index: true, uppercase: true, trim: true },
    convertedFromIdea: { type: Schema.Types.ObjectId, ref: 'Idea', default: null },
    // Team Workspace resources
    tasks: { type: [taskSchema], default: [] },
    links: { type: [linkSchema], default: [] },
  },
  { timestamps: true }
);

teamSchema.index({ 'missingSkills.name': 1 });

module.exports = mongoose.model('Team', teamSchema);
