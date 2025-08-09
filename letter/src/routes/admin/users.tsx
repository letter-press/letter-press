import { createResource, Show, For, createSignal } from "solid-js";
import { A, createAsync, redirect } from "@solidjs/router";
import AdminLayout from "./layout";
import { getUsers } from "../../lib";
import { getAdminSession } from "~/lib/auth-utils";
import { RoleManagement, UserRoleCard } from "~/components/admin/role-management";
import { PermissionGuard, usePermissions } from "~/components/auth/permission-guard";
import { Permission } from "~/lib/permissions";
import type { UserRole } from "@prisma/client";

// Server function to get auth and users data
async function getAdminUsersData() {
  "use server";

  // Use the cached admin session check
  const session = await getAdminSession();

  const result = await getUsers({ limit: 100 });

  return {
    session,
    users: result.data || [],
  };
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = createSignal("");
  const [selectedRole, setSelectedRole] = createSignal("all");
  const [editingUser, setEditingUser] = createSignal<any>(null);

  // Get both auth and data from server in one call
  const data = createAsync(() => getAdminUsersData(), {
    deferStream: true,
  });

  const session = () => data()?.session;
  const users = () => data()?.users || [];
  
  // Get user permissions
  const permissions = () => session()?.user?.role ? usePermissions(session()!.user.role as UserRole) : null;

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: newRole })
      });

      if (!response.ok) throw new Error('Failed to update role');
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Failed to update user role:', error);
      alert('Failed to update user role. Please try again.');
    }
  };

  // Filter users based on search and role
  const filteredUsers = () => {
    const userList = users();
    if (!userList) return [];
    
    return userList.filter((user: any) => {
      const matchesSearch = searchTerm() === "" || 
        user.name?.toLowerCase().includes(searchTerm().toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm().toLowerCase()) ||
        user.username?.toLowerCase().includes(searchTerm().toLowerCase());
      
      const matchesRole = selectedRole() === "all" || user.role === selectedRole();
      
      return matchesSearch && matchesRole;
    });
  };

  return (
    <Show 
      when={session()?.user} 
      fallback={
        <div class="min-h-screen flex items-center justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }
    >
      <AdminLayout user={session()!.user}>
        <div class="p-6">
          <div class="max-w-7xl mx-auto">
            {/* Enhanced Header */}
            <div class="mb-8">
              <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 class="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                    <span class="mr-3">👥</span>
                    User Management
                  </h1>
                  <p class="text-gray-600">
                    Manage users, roles, and permissions across your Letter-Press CMS.
                  </p>
                </div>
                <div class="mt-4 sm:mt-0">
                  <button class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
                    <span class="mr-2">➕</span>
                    Add New User
                  </button>
                </div>
              </div>

              {/* Search and Filter Bar */}
              <div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <div class="relative">
                    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span class="text-gray-400">🔍</span>
                    </div>
                    <input
                      type="text"
                      class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Search users by name, email, or username..."
                      value={searchTerm()}
                      onInput={(e) => setSearchTerm(e.currentTarget.value)}
                    />
                  </div>
                </div>
                <div>
                  <select
                    class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={selectedRole()}
                    onChange={(e) => setSelectedRole(e.currentTarget.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="ADMIN">Administrators</option>
                    <option value="EDITOR">Editors</option>
                    <option value="AUTHOR">Authors</option>
                    <option value="CONTRIBUTOR">Contributors</option>
                    <option value="SUBSCRIBER">Subscribers</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Enhanced User Stats */}
            <Show when={users()}>
              {(userList) => {
                const roleStats = userList().reduce((acc: Record<string, number>, user: any) => {
                  acc[user.role] = (acc[user.role] || 0) + 1;
                  return acc;
                }, {});

                const filtered = filteredUsers();
                const totalUsers = userList().length;
                const activeUsers = userList().filter((u: any) => u.lastLoginAt && 
                  new Date(u.lastLoginAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length;

                return (
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                    <UserStatsCard
                      title="Total Users"
                      value={totalUsers}
                      icon="👥"
                      color="blue"
                      subtitle={`${filtered.length} filtered`}
                    />
                    <UserStatsCard
                      title="Administrators"
                      value={roleStats.ADMIN || 0}
                      icon="👑"
                      color="red"
                      subtitle="Full access"
                    />
                    <UserStatsCard
                      title="Editors"
                      value={roleStats.EDITOR || 0}
                      icon="✏️"
                      color="green"
                      subtitle="Content management"
                    />
                    <UserStatsCard
                      title="Authors"
                      value={roleStats.AUTHOR || 0}
                      icon="📝"
                      color="yellow"
                      subtitle="Content creation"
                    />
                    <UserStatsCard
                      title="Active (30d)"
                      value={activeUsers}
                      icon="🔥"
                      color="purple"
                      subtitle="Recently logged in"
                    />
                  </div>
                );
              }}
            </Show>

            {/* Enhanced Users Table */}
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div class="flex items-center justify-between">
                  <h2 class="text-lg font-semibold text-gray-900">All Users</h2>
                  <div class="text-sm text-gray-500">
                    Showing {filteredUsers().length} of {users()?.length || 0} users
                  </div>
                </div>
              </div>
              
              <Show 
                when={filteredUsers().length > 0}
                fallback={
                  <div class="p-12 text-center">
                    <div class="text-6xl mb-4">👤</div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">
                      {searchTerm() || selectedRole() !== "all" ? "No matching users" : "No users found"}
                    </h3>
                    <p class="text-gray-500 mb-6">
                      {searchTerm() || selectedRole() !== "all" 
                        ? "Try adjusting your search criteria or filters."
                        : "Get started by adding your first user to the system."
                      }
                    </p>
                    <Show when={searchTerm() === "" && selectedRole() === "all"}>
                      <button class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
                        <span class="mr-2">➕</span>
                        Add First User
                      </button>
                    </Show>
                  </div>
                }
              >
                  <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200">
                      <thead class="bg-gray-50">
                        <tr>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            User
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Role
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Joined
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Activity
                          </th>
                          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Posts
                          </th>
                          <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody class="bg-white divide-y divide-gray-200">
                        <For each={filteredUsers()}>
                          {(user: any) => (
                            <tr class="hover:bg-gray-50 transition-colors">
                              <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center">
                                  <div class="flex-shrink-0 h-12 w-12">
                                    <Show 
                                      when={user.image}
                                      fallback={
                                        <div class="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                                          <span class="text-white font-semibold text-lg">
                                            {user.name?.charAt(0) || user.username?.charAt(0) || 'U'}
                                          </span>
                                        </div>
                                      }
                                    >
                                      <img class="h-12 w-12 rounded-full object-cover shadow-lg" src={user.image} alt="" />
                                    </Show>
                                  </div>
                                  <div class="ml-4">
                                    <div class="text-sm font-semibold text-gray-900">
                                      {user.name || user.username}
                                    </div>
                                    <div class="text-sm text-gray-500">{user.email}</div>
                                    <Show when={user.username && user.name}>
                                      <div class="text-xs text-gray-400">@{user.username}</div>
                                    </Show>
                                  </div>
                                </div>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap">
                                <div class="flex items-center space-x-2">
                                  <span class={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                    user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                    user.role === 'EDITOR' ? 'bg-blue-100 text-blue-800' :
                                    user.role === 'AUTHOR' ? 'bg-green-100 text-green-800' :
                                    user.role === 'CONTRIBUTOR' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {user.role === 'ADMIN' && '👑'} 
                                    {user.role === 'EDITOR' && '✏️'} 
                                    {user.role === 'AUTHOR' && '📝'} 
                                    {user.role === 'CONTRIBUTOR' && '🤝'} 
                                    {user.role === 'SUBSCRIBER' && '👀'} 
                                    {user.role}
                                  </span>
                                  <PermissionGuard
                                    userRole={session()!.user.role as UserRole}
                                    permission={Permission.MANAGE_ROLES}
                                  >
                                    <button
                                      onClick={() => setEditingUser(user)}
                                      class="text-gray-400 hover:text-gray-600 text-xs"
                                      title="Change role"
                                    >
                                      🔧
                                    </button>
                                  </PermissionGuard>
                                </div>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div>{new Date(user.createdAt).toLocaleDateString()}</div>
                                <div class="text-xs text-gray-400">
                                  {new Date(user.createdAt).toLocaleDateString() === new Date().toLocaleDateString() 
                                    ? 'Today' 
                                    : `${Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                                  }
                                </div>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <Show 
                                  when={user.lastLoginAt}
                                  fallback={
                                    <span class="text-gray-400 text-xs">Never logged in</span>
                                  }
                                >
                                  <div>
                                    <div class="text-sm">
                                      {new Date(user.lastLoginAt!).toLocaleDateString()}
                                    </div>
                                    <div class="text-xs text-gray-400">
                                      Last seen
                                    </div>
                                  </div>
                                </Show>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div class="flex items-center">
                                  <span class="font-medium text-gray-900">
                                    {user._count?.posts || 0}
                                  </span>
                                  <span class="ml-1 text-xs text-gray-400">posts</span>
                                </div>
                              </td>
                              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div class="flex items-center justify-end space-x-2">
                                  <button class="text-blue-600 hover:text-blue-800 px-3 py-1 rounded hover:bg-blue-50 transition-colors">
                                    Edit
                                  </button>
                                  <Show when={user.role !== 'ADMIN'}>
                                    <button class="text-red-600 hover:text-red-800 px-3 py-1 rounded hover:bg-red-50 transition-colors">
                                      Delete
                                    </button>
                                  </Show>
                                </div>
                              </td>
                            </tr>
                          )}
                        </For>
                      </tbody>
                    </table>
                  </div>
                </Show>
            </div>
          </div>
          
          {/* Role Edit Modal */}
          <Show when={editingUser()}>
            <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div class="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">
                  Edit User Role
                </h3>
                <div class="mb-4">
                  <div class="flex items-center space-x-3 mb-3">
                    <Show 
                      when={editingUser()?.image}
                      fallback={
                        <div class="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <span class="text-white font-semibold">
                            {editingUser()?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      }
                    >
                      <img class="h-10 w-10 rounded-full object-cover" src={editingUser()?.image} alt="" />
                    </Show>
                    <div>
                      <div class="font-medium text-gray-900">
                        {editingUser()?.name || editingUser()?.username}
                      </div>
                      <div class="text-sm text-gray-500">{editingUser()?.email}</div>
                    </div>
                  </div>
                  
                  <RoleManagement
                    currentUserRole={session()!.user.role as UserRole}
                    targetUserRole={editingUser()?.role as UserRole}
                    onRoleChange={(newRole) => {
                      const user = editingUser();
                      if (user) {
                        handleRoleChange(user.id, newRole);
                        setEditingUser(null);
                      }
                    }}
                    canManageRoles={permissions()?.can(Permission.MANAGE_ROLES) || false}
                  />
                </div>
                
                <div class="flex justify-end space-x-3">
                  <button
                    onClick={() => setEditingUser(null)}
                    class="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </Show>
        </div>
      </AdminLayout>
    </Show>
  );
}

// Enhanced Stats Card Component
function UserStatsCard(props: {
  title: string;
  value: number;
  icon: string;
  color: "blue" | "green" | "yellow" | "purple" | "red";
  subtitle?: string;
}) {
  const colorClasses = {
    blue: "bg-blue-500 hover:bg-blue-600",
    green: "bg-green-500 hover:bg-green-600",
    yellow: "bg-yellow-500 hover:bg-yellow-600",
    purple: "bg-purple-500 hover:bg-purple-600",
    red: "bg-red-500 hover:bg-red-600",
  };

  const bgColorClasses = {
    blue: "hover:bg-blue-50",
    green: "hover:bg-green-50", 
    yellow: "hover:bg-yellow-50",
    purple: "hover:bg-purple-50",
    red: "hover:bg-red-50",
  };

  return (
    <div class={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 cursor-pointer ${bgColorClasses[props.color]} hover:shadow-md hover:scale-105`}>
      <div class="flex items-center">
        <div class={`${colorClasses[props.color]} rounded-lg p-3 mr-4 transition-colors shadow-lg`}>
          <span class="text-white text-xl">{props.icon}</span>
        </div>
        <div class="flex-1">
          <p class="text-sm font-medium text-gray-600">{props.title}</p>
          <p class="text-2xl font-bold text-gray-900">
            {props.value.toLocaleString()}
          </p>
          <Show when={props.subtitle}>
            <p class="text-xs text-gray-500 mt-1">{props.subtitle}</p>
          </Show>
        </div>
      </div>
    </div>
  );
}


