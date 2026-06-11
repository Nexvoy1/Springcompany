import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  action: {
    type: String,
    enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'DOWNLOAD', 'UPLOAD'],
    required: true,
  },
  entityType: {
    type: String,
    required: true, // Content, User, Role, File, etc.
  },
  entityId: {
    type: String,
    required: true,
  },
  entityTitle: String,
  changes: {
    type: Map,
    of: String,
    default: {},
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['Success', 'Failed'],
    default: 'Success',
  },
  details: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: { expires: 7776000 }, // Auto-delete after 90 days
  },
}, { timestamps: false });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
export default ActivityLog;
