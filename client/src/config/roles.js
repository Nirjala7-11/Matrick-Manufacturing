/**
 * Centralized Role Definitions & Access Permissions
 * Aligned strictly with Backend User Model Schema (server/src/models/User.js)
 */

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  OPERATOR: 'operator',
  QUALITY_INSPECTOR: 'quality_inspector',
};

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Administrator',
  [ROLES.MANAGER]: 'Plant Manager',
  [ROLES.OPERATOR]: 'Shop Floor Operator',
  [ROLES.QUALITY_INSPECTOR]: 'Quality Inspector',
};

export const ROLE_BADGES = {
  [ROLES.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
  [ROLES.MANAGER]: 'bg-blue-100 text-blue-800 border-blue-200',
  [ROLES.OPERATOR]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [ROLES.QUALITY_INSPECTOR]: 'bg-amber-100 text-amber-800 border-amber-200',
};

/**
 * Check if user role matches allowed roles
 * @param {string} userRole - Current authenticated user role
 * @param {Array<string>|string} allowedRoles - Authorized role or array of roles
 * @returns {boolean}
 */
export const hasRole = (userRole, allowedRoles) => {
  if (!userRole) return false;
  if (!allowedRoles || allowedRoles.length === 0) return true;

  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(userRole);
  }

  return userRole === allowedRoles;
};

export default {
  ROLES,
  ALL_ROLES,
  ROLE_LABELS,
  ROLE_BADGES,
  hasRole,
};
