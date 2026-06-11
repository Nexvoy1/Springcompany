import mongoose from 'mongoose';

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Role name is required'],
    unique: true,
    enum: ['Super Admin', 'Admin', 'Content Manager', 'Moderator', 'Editor', 'Viewer', 'User'],
  },
  description: {
    type: String,
    default: '',
  },
  permissions: [{
    feature: String,
    actions: [String], // ['create', 'read', 'update', 'delete']
  }],
  level: {
    type: Number,
    default: 0, // Higher number = more permissions
  },
  isDefault: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { timestamps: true });

const Role = mongoose.model('Role', roleSchema);
export default Role;
