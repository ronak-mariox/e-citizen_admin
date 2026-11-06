import { client } from './client.js';

/**
 * What each role (admin, agent_1, agent_2, citizen) is currently allowed to
 * do (backend/src/routes/rolePermissions.routes.js). Permissions belong to
 * the role, not the account — every agent1 shares one set, every citizen
 * another.
 */

/** Every role's catalog + currently-granted keys, in one call — what the
    panel loads on open. */
export async function getAllRolePermissions() {
  const response = await client.get('/admins/role-permissions');

  return response.data.data.roles;
}

/** Replace one role's whole granted list. */
export async function updateRolePermissions(role, permissions) {
  const response = await client.patch(`/admins/role-permissions/${role}`, { permissions });

  return response.data.data.role;
}

export default { getAllRolePermissions, updateRolePermissions };
