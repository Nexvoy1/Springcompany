import mongoose from 'mongoose';

const settingSchema = new mongoose.Schema({
  key: {
    type: String,
    unique: true,
    lowercase: true,
    required: true, // e.g., 'mail_notification_enabled', 'max_upload_size'
  },
  value: mongoose.Schema.Types.Mixed, // Can be string, number, boolean, object, array
  type: {
    type: String,
    enum: ['String', 'Number', 'Boolean', 'JSON'],
    default: 'String',
  },
  description: String,
  category: {
    type: String,
    enum: ['Email', 'Upload', 'Security', 'API', 'General'],
    default: 'General',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Setting = mongoose.model('Setting', settingSchema);
export default Setting;
