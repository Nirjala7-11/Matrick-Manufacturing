/**
 * User Seed Data
 * Seed definitions for role-based users in Matrick Manufacturing System.
 */
export const usersSeed = [
  {
    name: 'System Administrator',
    email: 'admin@matrick.com',
    password: 'Password123!',
    role: 'admin',
  },
  {
    name: 'Manufacturing Manager',
    email: 'manager@matrick.com',
    password: 'Password123!',
    role: 'manager',
  },
  {
    name: 'Shop Floor Operator',
    email: 'operator@matrick.com',
    password: 'Password123!',
    role: 'operator',
  },
  {
    name: 'Quality Inspector',
    email: 'inspector@matrick.com',
    password: 'Password123!',
    role: 'quality_inspector',
  },
];

export default usersSeed;
