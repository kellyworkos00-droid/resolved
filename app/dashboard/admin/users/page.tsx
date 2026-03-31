'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Lock, X, Check, UserCheck, UserX, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLogin: string | null;
}

const ROLES = ['ADMIN', 'FINANCE_MANAGER', 'FINANCE_STAFF', 'VIEWER', 'POS_OPERATOR'];

const roleBadge = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    FINANCE_MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    FINANCE_STAFF: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    POS_OPERATOR: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    VIEWER: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return map[role] ?? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
};

type ModalMode = 'add' | 'edit' | 'password' | null;

export default function UsersManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');

  // Modal state
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);

  // Add/Edit form
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', role: 'VIEWER', password: '', isActive: true });
  // Password reset form
  const [newPassword, setNewPassword] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setError(data?.error?.message || 'Failed to load users'); return; }
      const usersData: User[] = Array.isArray(data?.data) ? data.data : [];
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  useEffect(() => {
    let filtered = users;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (u) => u.email.toLowerCase().includes(term) || u.firstName.toLowerCase().includes(term) || u.lastName.toLowerCase().includes(term)
      );
    }
    if (filterRole !== 'all') filtered = filtered.filter((u) => u.role === filterRole);
    setFilteredUsers(filtered);
  }, [searchTerm, filterRole, users]);

  const openAdd = () => {
    setForm({ email: '', firstName: '', lastName: '', role: 'VIEWER', password: '', isActive: true });
    setModalMode('add');
  };

  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({ email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, password: '', isActive: user.isActive });
    setModalMode('edit');
  };

  const openPasswordReset = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setModalMode('password');
  };

  const closeModal = () => { setModalMode(null); setSelectedUser(null); };

  const handleAddUser = async () => {
    if (!form.email || !form.firstName || !form.lastName || !form.password) {
      showToast('All fields are required'); return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/auth/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
    if (!res.ok) { showToast(data?.error?.message || 'Failed to create user'); return; }
      showToast('User created successfully');
      closeModal();
      loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName: form.firstName, lastName: form.lastName, role: form.role, isActive: form.isActive }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data?.error?.message || 'Failed to update user'); return; }
      showToast('User updated successfully');
      closeModal();
      loadUsers();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Deactivate ${user.firstName} ${user.lastName}? They will not be able to log in.`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { showToast(data?.error?.message || 'Failed to deactivate user'); return; }
      showToast('User deactivated');
      loadUsers();
    } catch { showToast('Failed to deactivate user'); }
  };

  const handleReactivate = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isActive: true }),
      });
      if (!res.ok) { showToast('Failed to reactivate user'); return; }
      showToast('User reactivated');
      loadUsers();
    } catch { showToast('Failed to reactivate user'); }
  };

  const handlePasswordReset = async () => {
    if (!selectedUser || !newPassword) { showToast('Enter a new password'); return; }
    if (newPassword.length < 8) { showToast('Password must be at least 8 characters'); return; }
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/auth/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { showToast(data?.error?.message || 'Failed to reset password'); return; }
      showToast('Password reset successfully');
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const roles = ROLES;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 rounded-lg bg-gray-900 px-5 py-3 text-white shadow-xl text-sm">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-800">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/control" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400">
                <ArrowLeft className="h-4 w-4" />Back to Control
              </Link>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Management</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={loadUsers} className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors">
                <RefreshCw className="h-4 w-4" />Refresh
              </button>
              <button onClick={openAdd} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 transition-colors">
                <Plus className="h-4 w-4" />Add User
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800/50 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input type="text" placeholder="Name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Role</label>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
              <option value="all">All Roles</option>
              {roles.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        {/* Users Table */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading users...</p>
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 overflow-hidden">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">No users found.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      {['Name', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map((h) => (
                        <th key={h} className={`px-6 py-3 text-sm font-semibold text-gray-900 dark:text-white ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          {user.firstName} {user.lastName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${roleBadge(user.role)}`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'}`}>
                            {user.isActive ? '● Active' : '○ Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button title="Edit user" onClick={() => openEdit(user)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg dark:text-blue-400 dark:hover:bg-blue-900/30 transition-colors">
                              <Edit2 className="h-4 w-4" />
                            </button>
                            <button title="Reset password" onClick={() => openPasswordReset(user)}
                              className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-lg dark:text-yellow-400 dark:hover:bg-yellow-900/30 transition-colors">
                              <Lock className="h-4 w-4" />
                            </button>
                            {user.isActive ? (
                              <button title="Deactivate user" onClick={() => handleDeleteUser(user)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg dark:text-red-400 dark:hover:bg-red-900/30 transition-colors">
                                <UserX className="h-4 w-4" />
                              </button>
                            ) : (
                              <button title="Reactivate user" onClick={() => handleReactivate(user)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg dark:text-green-400 dark:hover:bg-green-900/30 transition-colors">
                                <UserCheck className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: 'Total Users', value: users.length, color: 'text-gray-900 dark:text-white' },
            { label: 'Active', value: users.filter((u) => u.isActive).length, color: 'text-green-600 dark:text-green-400' },
            { label: 'Inactive', value: users.filter((u) => !u.isActive).length, color: 'text-gray-500 dark:text-gray-400' },
            { label: 'Admins', value: users.filter((u) => u.role === 'ADMIN').length, color: 'text-red-600 dark:text-red-400' },
          ].map((s) => (
            <div key={s.label} className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <p className="text-sm text-gray-600 dark:text-gray-400">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Add User Modal ── */}
      {modalMode === 'add' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add New User</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role & Permissions *</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {roles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {form.role === 'ADMIN' && 'Full system access — all modules and user management.'}
                  {form.role === 'FINANCE_MANAGER' && 'Full financial operations, reports, purchasing, HR, and inventory.'}
                  {form.role === 'FINANCE_STAFF' && 'Data entry, payments, stock adjustments, and basic reports.'}
                  {form.role === 'VIEWER' && 'Read-only access to dashboards and reports.'}
                  {form.role === 'POS_OPERATOR' && 'POS terminal access: sales, checkout, customer invoices.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActiveAdd" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="isActiveAdd" className="text-sm text-gray-700 dark:text-gray-300">Account active (user can log in immediately)</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleAddUser} disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>Creating...</> : <><Check className="h-4 w-4" />Create User</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit User Modal ── */}
      {modalMode === 'edit' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Edit User</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">Editing: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedUser.email}</span></p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
                  <input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
                  <input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role & Permissions</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                  {roles.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {form.role === 'ADMIN' && 'Full system access — all modules and user management.'}
                  {form.role === 'FINANCE_MANAGER' && 'Full financial operations, reports, purchasing, HR, and inventory.'}
                  {form.role === 'FINANCE_STAFF' && 'Data entry, payments, stock adjustments, and basic reports.'}
                  {form.role === 'VIEWER' && 'Read-only access to dashboards and reports.'}
                  {form.role === 'POS_OPERATOR' && 'POS terminal access: sales, checkout, customer invoices.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="isActiveEdit" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300" />
                <label htmlFor="isActiveEdit" className="text-sm text-gray-700 dark:text-gray-300">Account active</label>
              </div>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handleEditUser} disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50">
                {saving ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>Saving...</> : <><Check className="h-4 w-4" />Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reset Password Modal ── */}
      {modalMode === 'password' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-gray-800 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Reset Password</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X className="h-5 w-5" /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Set a new password for <span className="font-semibold text-gray-900 dark:text-white">{selectedUser.firstName} {selectedUser.lastName}</span>.
              </p>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">New Password *</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700 dark:text-white" />
              </div>
              <p className="text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg px-3 py-2 border border-yellow-200 dark:border-yellow-800/50">
                Share this password securely with the user. They should change it after first login.
              </p>
            </div>
            <div className="flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
              <button onClick={closeModal} className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancel</button>
              <button onClick={handlePasswordReset} disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-600 px-4 py-2 text-sm text-white hover:bg-yellow-700 disabled:opacity-50">
                {saving ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-r-transparent"></div>Resetting...</> : <><Lock className="h-4 w-4" />Reset Password</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
