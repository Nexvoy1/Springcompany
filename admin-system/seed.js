import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB, disconnectDB } from './backend/config/database.js';
import User from './backend/models/User.js';
import Role from './backend/models/Role.js';

dotenv.config();

const seedDatabase = async () => {
  try {
    await connectDB();
    console.log('✓ Connected to MongoDB');

    // Clear existing roles and users (optional - comment out for safety)
    // await Role.deleteMany({});
    // await User.deleteMany({});
    // console.log('✓ Cleared existing data');

    // Create default roles
    const roles = [
      {
        name: 'Super Admin',
        level: 100,
        description: 'Full system access',
        permissions: [
          {
            feature: 'Users',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
          },
          {
            feature: 'Content',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PUBLISH'],
          },
          {
            feature: 'Roles',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE'],
          },
          {
            feature: 'Settings',
            actions: ['READ', 'UPDATE'],
          },
          {
            feature: 'Logs',
            actions: ['READ'],
          },
        ],
      },
      {
        name: 'Admin',
        level: 80,
        description: 'Administrative access',
        permissions: [
          {
            feature: 'Users',
            actions: ['READ', 'UPDATE'],
          },
          {
            feature: 'Content',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PUBLISH'],
          },
          {
            feature: 'Settings',
            actions: ['READ'],
          },
          {
            feature: 'Logs',
            actions: ['READ'],
          },
        ],
      },
      {
        name: 'Content Manager',
        level: 60,
        description: 'Manage content and publications',
        permissions: [
          {
            feature: 'Content',
            actions: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'PUBLISH'],
          },
          {
            feature: 'Users',
            actions: ['READ'],
          },
        ],
      },
      {
        name: 'Editor',
        level: 40,
        description: 'Edit and publish content',
        permissions: [
          {
            feature: 'Content',
            actions: ['CREATE', 'READ', 'UPDATE', 'PUBLISH'],
          },
        ],
      },
      {
        name: 'Moderator',
        level: 30,
        description: 'Moderate user-generated content',
        permissions: [
          {
            feature: 'Content',
            actions: ['READ', 'UPDATE'],
          },
        ],
      },
      {
        name: 'Viewer',
        level: 10,
        description: 'View content only',
        permissions: [
          {
            feature: 'Content',
            actions: ['READ'],
          },
        ],
      },
      {
        name: 'User',
        level: 1,
        description: 'Regular user',
        permissions: [
          {
            feature: 'Profile',
            actions: ['READ', 'UPDATE'],
          },
        ],
      },
    ];

    const createdRoles = [];
    for (const roleData of roles) {
      const existingRole = await Role.findOne({ name: roleData.name });
      if (!existingRole) {
        const role = await Role.create(roleData);
        createdRoles.push(role);
        console.log(`  ✓ Created role: ${roleData.name}`);
      } else {
        createdRoles.push(existingRole);
        console.log(`  • Role already exists: ${roleData.name}`);
      }
    }

    // Create default admin user
    const superAdminRole = createdRoles.find(r => r.name === 'Super Admin');
    const existingAdmin = await User.findOne({ email: 'admin@springcompany.com' });

    if (!existingAdmin) {
      const adminUser = await User.create({
        firstName: 'System',
        lastName: 'Administrator',
        email: 'admin@springcompany.com',
        password: 'admin123456', // Change this in production!
        phone: '+1234567890',
        role: superAdminRole._id,
        isActive: true,
      });
      console.log('✓ Created Super Admin user');
      console.log('  Email: admin@springcompany.com');
      console.log('  Password: admin123456 (CHANGE IN PRODUCTION)');
    } else {
      console.log('• Admin user already exists');
    }

    console.log('\n✓ Database seeding completed successfully!');
    await disconnectDB();
  } catch (err) {
    console.error('✗ Seeding error:', err.message);
    process.exit(1);
  }
};

seedDatabase();
