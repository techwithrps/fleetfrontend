import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  Shield,
  Plus,
  RefreshCw,
  KeyRound,
  Users,
  Building2,
  Save,
  MapPin,
  ChevronDown,
  Search,
  Check,
  ChevronRight,
} from "lucide-react";
import { iamAPI, locationAPI } from "../utils/Api";

const parseTerminalIds = (value) =>
  value
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

const parseIdList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item) && item > 0);

const groupPermissions = (permissions) =>
  permissions.reduce((accumulator, permission) => {
    const moduleName = permission.module_name || "general";
    if (!accumulator[moduleName]) {
      accumulator[moduleName] = [];
    }
    accumulator[moduleName].push(permission);
    return accumulator;
  }, {});

const buildTerminalOptions = (locations) => {
  const terminalMap = new Map();

  (locations || []).forEach((location) => {
    const terminalId = Number(location.TERMINAL_ID);
    if (!Number.isFinite(terminalId) || terminalId <= 0) {
      return;
    }

    const locationName = String(location.LOCATION_NAME || "").trim();
    if (!terminalMap.has(terminalId)) {
      terminalMap.set(terminalId, new Set());
    }

    if (locationName) {
      terminalMap.get(terminalId).add(locationName);
    }
  });

  return Array.from(terminalMap.entries())
    .map(([terminalId, names]) => ({
      id: terminalId,
      label:
        names.size > 0
          ? `Terminal ${terminalId} - ${Array.from(names).slice(0, 2).join(", ")}`
          : `Terminal ${terminalId}`,
    }))
    .sort((left, right) => left.id - right.id);
};

const MultiSelect = ({
  label,
  options,
  selected,
  onToggle,
  searchPlaceholder = "Search...",
  emptyText = "No options",
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((opt) => String(opt.label).toLowerCase().includes(q));
  }, [options, query]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);
  const selectedOptions = useMemo(
    () => options.filter((opt) => selectedSet.has(opt.id)),
    [options, selectedSet]
  );

  return (
    <div className="relative">
      <div className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 shadow-sm transition hover:border-slate-300"
      >
        <span className="truncate">
          {selectedOptions.length > 0
            ? selectedOptions.map((opt) => opt.label).join(", ")
            : "Select..."}
        </span>
        <ChevronDown className="ml-3 h-4 w-4 flex-shrink-0 text-slate-500" />
      </button>

      {selectedOptions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedOptions.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => onToggle(opt.id)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 ring-1 ring-inset ring-blue-100 transition hover:bg-blue-100"
              title="Click to remove"
            >
              <span className="truncate">{opt.label}</span>
              <span className="text-blue-500">x</span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-100 bg-slate-50 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="p-3 text-sm text-slate-500">{emptyText}</div>
            ) : (
              filtered.map((opt) => {
                const checked = selectedSet.has(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onToggle(opt.id)}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-50"
                  >
                    <span className="pr-3">{opt.label}</span>
                    {checked && <Check className="h-4 w-4 text-blue-600" />}
                  </button>
                );
              })
            )}
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 p-3">
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setOpen(false);
              }}
              className="rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default function IamManagement() {
  const [loading, setLoading] = useState(true);
  const [savingRoleId, setSavingRoleId] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [permissionQuery, setPermissionQuery] = useState("");
  const [userQuery, setUserQuery] = useState("");
  const [collapsedModules, setCollapsedModules] = useState({});
  const [bootstrap, setBootstrap] = useState({
    roles: [],
    permissions: [],
    users: [],
  });
  const [terminalOptions, setTerminalOptions] = useState([]);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [userDrafts, setUserDrafts] = useState({});
  const [newRole, setNewRole] = useState({
    roleCode: "",
    roleName: "",
    description: "",
  });

  const permissionGroups = useMemo(
    () => groupPermissions(bootstrap.permissions),
    [bootstrap.permissions]
  );

  const selectedRole = useMemo(() => {
    const roleId = Number(selectedRoleId);
    return bootstrap.roles.find((role) => Number(role.id) === roleId) || null;
  }, [bootstrap.roles, selectedRoleId]);

  const filteredPermissionGroups = useMemo(() => {
    const query = permissionQuery.trim().toLowerCase();
    if (!query) {
      return permissionGroups;
    }

    const nextGroups = {};
    Object.entries(permissionGroups).forEach(([moduleName, permissions]) => {
      const matches = permissions.filter((permission) => {
        return (
          String(permission.perm_name || "").toLowerCase().includes(query) ||
          String(permission.perm_code || "").toLowerCase().includes(query)
        );
      });
      if (matches.length > 0) {
        nextGroups[moduleName] = matches;
      }
    });

    return nextGroups;
  }, [permissionGroups, permissionQuery]);

  const filteredUsers = useMemo(() => {
    const query = userQuery.trim().toLowerCase();
    if (!query) {
      return bootstrap.users;
    }

    return bootstrap.users.filter((user) => {
      return (
        String(user.name || "").toLowerCase().includes(query) ||
        String(user.email || "").toLowerCase().includes(query) ||
        String(user.user_id || "").toLowerCase().includes(query)
      );
    });
  }, [bootstrap.users, userQuery]);

  const loadBootstrap = async () => {
    setLoading(true);
    try {
      const response = await iamAPI.getBootstrap();
      if (!response.enabled) {
        toast.info(response.message || "Run IAM migration to enable this module.");
        setBootstrap({ roles: [], permissions: [], users: [] });
        return;
      }

      const data = response.data || {};
      setBootstrap({
        roles: data.roles || [],
        permissions: data.permissions || [],
        users: data.users || [],
      });

      const roles = data.roles || [];
      const nextRoleDrafts = {};
      roles.forEach((role) => {
        nextRoleDrafts[role.id] = parseIdList(role.permission_ids);
      });
      setRoleDrafts(nextRoleDrafts);

      setSelectedRoleId((previous) => {
        if (previous && roles.some((role) => Number(role.id) === Number(previous))) {
          return previous;
        }
        return roles[0]?.id ?? null;
      });

      const nextUserDrafts = {};
      (data.users || []).forEach((user) => {
        nextUserDrafts[user.user_id] = {
          roleIds: parseIdList(user.role_ids),
          terminalIds: user.terminal_ids || user.default_terminal_id || "",
        };
      });
      setUserDrafts(nextUserDrafts);
    } catch (error) {
      toast.error(error.message || "Failed to load IAM data");
    } finally {
      setLoading(false);
    }
  };

  const loadTerminalOptions = async () => {
    try {
      const response = await iamAPI.getTerminals();
      const rows = response?.data || [];
      setTerminalOptions(
        rows
          .map((row) => ({
            id: Number(row.terminalId),
            label: String(row.label || `Terminal ${row.terminalId}`),
          }))
          .filter((row) => Number.isFinite(row.id) && row.id > 0)
          .sort((a, b) => a.id - b.id)
      );
    } catch (error) {
      toast.error(error.message || "Failed to load terminal options");
    }
  };

  useEffect(() => {
    loadBootstrap();
    loadTerminalOptions();
  }, []);

  const handleCreateRole = async (event) => {
    event.preventDefault();
    if (!newRole.roleCode || !newRole.roleName) {
      toast.error("Role code and role name are required");
      return;
    }

    try {
      const response = await iamAPI.createRole(newRole);
      if (response.success) {
        toast.success("IAM role created");
        setNewRole({ roleCode: "", roleName: "", description: "" });
        loadBootstrap();
      }
    } catch (error) {
      toast.error(error.message || "Failed to create role");
    }
  };

  const handleSeedDefaults = async () => {
    try {
      const response = await iamAPI.seedDefaults();
      if (response.success) {
        toast.success("Default permissions added");
        loadBootstrap();
      }
    } catch (error) {
      toast.error(error.message || "Failed to seed default permissions");
    }
  };

  const toggleRolePermission = (roleId, permissionId) => {
    setRoleDrafts((previous) => {
      const current = previous[roleId] || [];
      return {
        ...previous,
        [roleId]: current.includes(permissionId)
          ? current.filter((id) => id !== permissionId)
          : [...current, permissionId],
      };
    });
  };

  const saveRolePermissions = async (roleId) => {
    setSavingRoleId(roleId);
    try {
      const response = await iamAPI.updateRolePermissions(roleId, roleDrafts[roleId] || []);
      if (response.success) {
        toast.success("Role permissions updated");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update role permissions");
    } finally {
      setSavingRoleId(null);
    }
  };

  const toggleModuleCollapsed = (moduleName) => {
    setCollapsedModules((previous) => ({
      ...previous,
      [moduleName]: !previous[moduleName],
    }));
  };

  const toggleUserRole = (userId, roleId) => {
    setUserDrafts((previous) => {
      const current = previous[userId]?.roleIds || [];
      return {
        ...previous,
        [userId]: {
          ...previous[userId],
          roleIds: current.includes(roleId)
            ? current.filter((id) => id !== roleId)
            : [...current, roleId],
        },
      };
    });
  };

  const updateUserTerminals = (userId, value) => {
    setUserDrafts((previous) => ({
      ...previous,
      [userId]: {
        ...previous[userId],
        terminalIds: value,
      },
    }));
  };

  const toggleUserTerminal = (userId, terminalId) => {
    setUserDrafts((previous) => {
      const current = parseIdList(previous[userId]?.terminalIds || "");
      const nextTerminalIds = current.includes(terminalId)
        ? current.filter((id) => id !== terminalId)
        : [...current, terminalId].sort((left, right) => left - right);

      return {
        ...previous,
        [userId]: {
          ...previous[userId],
          terminalIds: nextTerminalIds.join(","),
        },
      };
    });
  };

  const saveUserAccess = async (userId) => {
    const draft = userDrafts[userId] || { roleIds: [], terminalIds: "" };
    setSavingUserId(userId);
    try {
      const response = await iamAPI.updateUserAccess(userId, {
        roleIds: draft.roleIds || [],
        terminalIds: parseTerminalIds(String(draft.terminalIds || "")),
      });
      if (response.success) {
        toast.success("User IAM access updated");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update user access");
    } finally {
      setSavingUserId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">IAM Access Control</h1>
            <p className="mt-1 text-sm text-slate-500">
              Manage roles, permissions, and terminal-scoped user access from one place.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Step 1</div>
                <div className="mt-1 font-semibold">Create a role</div>
                <div className="text-xs text-slate-500">Example: JAIPUR_MANAGER</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Step 2</div>
                <div className="mt-1 font-semibold">Assign permissions</div>
                <div className="text-xs text-slate-500">Tick what the role can do</div>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">Step 3</div>
                <div className="mt-1 font-semibold">Assign users + terminals</div>
                <div className="text-xs text-slate-500">Choose terminal access scope</div>
              </div>
            </div>
          </div>
          <button
            onClick={loadBootstrap}
            className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh IAM
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1.9fr]">
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Create IAM Role</h2>
              <p className="text-sm text-slate-500">Add a reusable access profile for your team.</p>
            </div>
          </div>

          <form onSubmit={handleCreateRole} className="mt-6 space-y-4">
            <input
              value={newRole.roleCode}
              onChange={(event) =>
                setNewRole((previous) => ({
                  ...previous,
                  roleCode: event.target.value.toUpperCase(),
                }))
              }
              placeholder="ROLE_CODE"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold uppercase tracking-wide outline-none transition focus:border-blue-500 focus:bg-white"
            />
            <input
              value={newRole.roleName}
              onChange={(event) =>
                setNewRole((previous) => ({
                  ...previous,
                  roleName: event.target.value,
                }))
              }
              placeholder="Role name"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
            <textarea
              value={newRole.description}
              onChange={(event) =>
                setNewRole((previous) => ({
                  ...previous,
                  description: event.target.value,
                }))
              }
              placeholder="What should this role be able to do?"
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
            <button
              type="submit"
              className="inline-flex w-full items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <Shield className="mr-2 h-4 w-4" />
              Create Role
            </button>
          </form>
        </div>

        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">Role Permissions</h2>
              <p className="text-sm text-slate-500">
                Pick a role, then tick permissions. This is what controls access (not role name checks).
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {bootstrap.permissions.length === 0 && (
              <div className="rounded-2xl border border-dashed border-amber-200 bg-amber-50 p-5">
                <div className="text-sm font-semibold text-amber-900">
                  No permissions found yet
                </div>
                <p className="mt-1 text-sm text-amber-800">
                  Your IAM tables exist, but default permission records are missing. Seed them once,
                  then the checkboxes will appear here.
                </p>
                <button
                  onClick={handleSeedDefaults}
                  className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Default Permissions
                </button>
              </div>
            )}

            {bootstrap.roles.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                Create a role first, then come back here to assign permissions.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="w-full md:max-w-xs">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Select Role
                    </div>
                    <div className="relative mt-2">
                      <select
                        value={selectedRoleId ?? ""}
                        onChange={(event) => setSelectedRoleId(event.target.value)}
                        className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-800 outline-none transition focus:border-blue-500"
                      >
                        {bootstrap.roles.map((role) => (
                          <option key={role.id} value={role.id}>
                            {role.role_name} ({role.role_code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col gap-2 md:items-end">
                    <div className="relative w-full md:max-w-sm">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        value={permissionQuery}
                        onChange={(event) => setPermissionQuery(event.target.value)}
                        placeholder="Search permissions (e.g. USER_, MASTER_)"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
                      />
                    </div>
                    <button
                      onClick={() => selectedRole && saveRolePermissions(selectedRole.id)}
                      disabled={!selectedRole || savingRoleId === selectedRole?.id}
                      className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      {savingRoleId === selectedRole?.id ? "Saving..." : "Save Permissions"}
                    </button>
                  </div>
                </div>

                {selectedRole && (
                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    {Object.entries(filteredPermissionGroups).map(([moduleName, permissions]) => (
                      <div key={`${selectedRole.id}-${moduleName}`} className="rounded-2xl bg-slate-50 p-4">
                        <button
                          type="button"
                          onClick={() => toggleModuleCollapsed(moduleName)}
                          className="flex w-full items-center justify-between rounded-xl bg-white px-3 py-2 text-left text-xs font-black uppercase tracking-[0.18em] text-slate-600 shadow-sm"
                        >
                          <span>{moduleName}</span>
                          <ChevronDown
                            className={`h-4 w-4 text-slate-500 transition ${
                              collapsedModules[moduleName] ? "-rotate-90" : "rotate-0"
                            }`}
                          />
                        </button>

                        {!collapsedModules[moduleName] && (
                          <div className="mt-3 space-y-2">
                            {permissions.map((permission) => (
                              <label
                                key={`${selectedRole.id}-${permission.id}`}
                                className="flex items-start gap-3 rounded-xl bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
                              >
                                <input
                                  type="checkbox"
                                  checked={(roleDrafts[selectedRole.id] || []).includes(permission.id)}
                                  onChange={() => toggleRolePermission(selectedRole.id, permission.id)}
                                  className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span>
                                  <span className="block font-semibold">{permission.perm_name}</span>
                                  <span className="block text-xs text-slate-500">{permission.perm_code}</span>
                                </span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">User Access Mapping</h2>
            <p className="text-sm text-slate-500">
              Assign IAM roles and terminal access. Expand a user to edit access.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={userQuery}
              onChange={(event) => setUserQuery(event.target.value)}
              placeholder="Search user (name, email, id)"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white"
            />
          </div>
          <div className="text-xs text-slate-500">
            Showing <span className="font-bold text-slate-700">{filteredUsers.length}</span> users
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {bootstrap.users.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
              No tenant-linked users found yet. Once users are attached to this tenant, they will appear here.
            </div>
          )}

          {filteredUsers.map((user) => (
            <details
              key={user.user_id}
              className="group rounded-2xl border border-slate-200 bg-white shadow-sm open:shadow-md"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-black text-white">
                    {String(user.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-800">
                      {user.name} <span className="text-xs text-slate-400">#{user.user_id}</span>
                    </div>
                    <div className="truncate text-xs text-slate-500">{user.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 md:inline-flex">
                    <Building2 className="mr-2 h-3.5 w-3.5" />
                    Terminals: {userDrafts[user.user_id]?.terminalIds || user.terminal_ids || user.default_terminal_id || "None"}
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-500 transition group-open:rotate-90" />
                </div>
              </summary>

              <div className="border-t border-slate-100 bg-slate-50/40 px-4 py-4">
                <div className="grid gap-4 lg:grid-cols-[1.4fr_1.4fr_auto]">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <MultiSelect
                      label="Roles"
                      options={bootstrap.roles.map((role) => ({
                        id: role.id,
                        label: `${role.role_name} (${role.role_code})`,
                      }))}
                      selected={userDrafts[user.user_id]?.roleIds || []}
                      onToggle={(roleId) => toggleUserRole(user.user_id, roleId)}
                      searchPlaceholder="Search roles..."
                      emptyText="No roles"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <MultiSelect
                      label="Terminals"
                      options={terminalOptions.map((terminal) => ({
                        id: terminal.id,
                        label: terminal.label,
                      }))}
                      selected={parseIdList(userDrafts[user.user_id]?.terminalIds || "")}
                      onToggle={(terminalId) => toggleUserTerminal(user.user_id, terminalId)}
                      searchPlaceholder="Search terminals..."
                      emptyText="No terminals"
                    />

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5" />
                      Selected IDs:{" "}
                      <span className="font-bold text-slate-700">
                        {userDrafts[user.user_id]?.terminalIds || "None"}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => saveUserAccess(user.user_id)}
                    disabled={savingUserId === user.user_id}
                    className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700 disabled:opacity-60"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    {savingUserId === user.user_id ? "Saving..." : "Save Access"}
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
