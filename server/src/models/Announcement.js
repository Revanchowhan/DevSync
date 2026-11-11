const mongoose = require('mongoose');

const { Schema } = mongoose;

const announcementSchema = new Schema(
  {
    hackathon: { type: Schema.Types.ObjectId, ref: 'Hackathon', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    body: { type: String, required: true, trim: true, maxlength: 5000 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Announcement', announcementSchema);
