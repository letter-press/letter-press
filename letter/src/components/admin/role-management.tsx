import { For, Show, createSignal, type JSX } from "solid-js";
import type { UserRole } from "@prisma/client";
import { 
    Permission, 
    ROLE_PERMISSIONS, 
    PERMISSION_DESCRIPTIONS, 
    ROLE_DESCRIPTIONS,
    getPermissionGroups,
    hasPermission
} from "~/lib/permissions";

interface RoleManagementProps {
    currentUserRole: UserRole;
    targetUserRole: UserRole;
    onRoleChange: (newRole: UserRole) => void;
    canManageRoles: boolean;
}

export function RoleManagement(props: RoleManagementProps): JSX.Element {
    const [showPermissions, setShowPermissions] = createSignal(false);

    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'ADMIN': return '👑';
            case 'EDITOR': return '✏️';
            case 'AUTHOR': return '📝';
            case 'CONTRIBUTOR': return '🤝';
            case 'SUBSCRIBER': return '👀';
            default: return '👤';
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-100 text-purple-800 border-purple-200';
            case 'EDITOR': return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'AUTHOR': return 'bg-green-100 text-green-800 border-green-200';
            case 'CONTRIBUTOR': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'SUBSCRIBER': return 'bg-gray-100 text-gray-800 border-gray-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const availableRoles: UserRole[] = ['SUBSCRIBER', 'CONTRIBUTOR', 'AUTHOR', 'EDITOR', 'ADMIN'];

    // Filter roles based on current user's permissions
    const selectableRoles = () => {
        if (props.currentUserRole === 'ADMIN') {
            return availableRoles; // Admins can assign any role
        }
        // Other roles can only assign roles below their level
        return availableRoles.filter(role => {
            const roleIndex = availableRoles.indexOf(role);
            const currentRoleIndex = availableRoles.indexOf(props.currentUserRole);
            return roleIndex < currentRoleIndex;
        });
    };

    return (
        <div class="role-management">
            {/* Current Role Display */}
            <div class="mb-4">
                <label class="block text-sm font-medium text-gray-700 mb-2">
                    User Role
                </label>
                <div class="flex items-center space-x-3">
                    <div class={`inline-flex items-center px-3 py-2 rounded-lg border ${getRoleColor(props.targetUserRole)}`}>
                        <span class="mr-2">{getRoleIcon(props.targetUserRole)}</span>
                        <span class="font-medium">{props.targetUserRole}</span>
                    </div>
                    <button
                        onClick={() => setShowPermissions(!showPermissions())}
                        class="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        {showPermissions() ? 'Hide' : 'View'} Permissions
                    </button>
                </div>
                <p class="text-sm text-gray-600 mt-1">
                    {ROLE_DESCRIPTIONS[props.targetUserRole]}
                </p>
            </div>

            {/* Role Selector */}
            <Show when={props.canManageRoles}>
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        Change Role
                    </label>
                    <select
                        value={props.targetUserRole}
                        onChange={(e) => props.onRoleChange(e.currentTarget.value as UserRole)}
                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <For each={selectableRoles()}>
                            {(role) => (
                                <option value={role}>
                                    {getRoleIcon(role)} {role} - {ROLE_DESCRIPTIONS[role]}
                                </option>
                            )}
                        </For>
                    </select>
                </div>
            </Show>

            {/* Permission Details */}
            <Show when={showPermissions()}>
                <div class="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <h4 class="font-medium text-gray-900 mb-3">Role Permissions</h4>
                    <PermissionList role={props.targetUserRole} />
                </div>
            </Show>
        </div>
    );
}

interface PermissionListProps {
    role: UserRole;
}

function PermissionList(props: PermissionListProps): JSX.Element {
    const permissionGroups = getPermissionGroups();

    return (
        <div class="space-y-4">
            <For each={Object.entries(permissionGroups) as [string, Permission[]][]}>
                {([groupName, permissions]) => (
                    <div>
                        <h5 class="text-sm font-medium text-gray-800 mb-2">{groupName}</h5>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <For each={permissions}>
                                {(permission) => {
                                    const hasAccess = hasPermission(props.role, permission);
                                    return (
                                        <div class={`flex items-center space-x-2 text-sm p-2 rounded ${
                                            hasAccess 
                                                ? 'bg-green-50 text-green-800' 
                                                : 'bg-red-50 text-red-600'
                                        }`}>
                                            <span class="text-lg">
                                                {hasAccess ? '✅' : '❌'}
                                            </span>
                                            <span>{PERMISSION_DESCRIPTIONS[permission]}</span>
                                        </div>
                                    );
                                }}
                            </For>
                        </div>
                    </div>
                )}
            </For>
        </div>
    );
}

interface UserRoleCardProps {
    role: UserRole;
    userCount: number;
    onManage?: () => void;
}

export function UserRoleCard(props: UserRoleCardProps): JSX.Element {
    const getRoleIcon = (role: UserRole) => {
        switch (role) {
            case 'ADMIN': return '👑';
            case 'EDITOR': return '✏️';
            case 'AUTHOR': return '📝';
            case 'CONTRIBUTOR': return '🤝';
            case 'SUBSCRIBER': return '👀';
            default: return '👤';
        }
    };

    const getRoleColor = (role: UserRole) => {
        switch (role) {
            case 'ADMIN': return 'border-purple-200 bg-purple-50';
            case 'EDITOR': return 'border-blue-200 bg-blue-50';
            case 'AUTHOR': return 'border-green-200 bg-green-50';
            case 'CONTRIBUTOR': return 'border-yellow-200 bg-yellow-50';
            case 'SUBSCRIBER': return 'border-gray-200 bg-gray-50';
            default: return 'border-gray-200 bg-gray-50';
        }
    };

    return (
        <div class={`border rounded-lg p-4 ${getRoleColor(props.role)} hover:shadow-sm transition-shadow`}>
            <div class="flex items-center justify-between mb-3">
                <div class="flex items-center space-x-2">
                    <span class="text-2xl">{getRoleIcon(props.role)}</span>
                    <div>
                        <h3 class="font-medium text-gray-900">{props.role}</h3>
                        <p class="text-sm text-gray-600">{props.userCount} users</p>
                    </div>
                </div>
                <Show when={props.onManage}>
                    <button
                        onClick={props.onManage}
                        class="text-sm text-blue-600 hover:text-blue-800 underline"
                    >
                        Manage
                    </button>
                </Show>
            </div>
            <p class="text-sm text-gray-700">
                {ROLE_DESCRIPTIONS[props.role]}
            </p>
        </div>
    );
}