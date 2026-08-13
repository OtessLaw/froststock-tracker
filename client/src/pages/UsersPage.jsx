import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, UserPlus, Pencil, AlertCircle, Loader2, X,
  Eye, EyeOff, CheckCircle, XCircle, Mail, Lock, User,
} from 'lucide-react';
import toast from 'react-hot-toast';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatDateTime } from '../utils/helpers';

// ── Skeleton ─────────────────────────────────────────────────────────────────
const Skeleton = ({ className = '' }) => (
  <div className={`animate-pulse bg-pink-100 rounded-xl ${className}`} />
);

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => (
  <span className={role === 'admin' ? 'badge-blue' : 'badge-pink'}>
    {role === 'admin' ? <Shield size={11} /> : <User size={11} />}
    {role === 'admin' ? 'Admin' : 'Staff'}
  </span>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const StatusBadge = ({ active }) => (
  active
    ? <span className="badge-success"><CheckCircle size={11} />Active</span>
    : <span className="badge-danger"><XCircle size={11} />Inactive</span>
);

// ── Toggle component ──────────────────────────────────────────────────────────
const Toggle = ({ checked, onChange }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
      ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200
        ${checked ? 'translate-x-6' : 'translate-x-1'}`}
    />
  </button>
);

// ── User modal (add + edit) ───────────────────────────────────────────────────
const EMPTY_ADD = { name: '', email: '', password: '', role: 'staff', active: true };

const UserModal = ({ open, onClose, onSaved, editUser }) => {
  const [form, setForm]         = useState(EMPTY_ADD);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving]     = useState(false);
  const isEdit                  = !!editUser;

  useEffect(() => {
    if (open) {
      setForm(isEdit ? {
        name:     editUser.name    || '',
        email:    editUser.email   || '',
        password: '',
        role:     editUser.role    || 'staff',
        active:   editUser.active  ?? true,
      } : EMPTY_ADD);
      setShowPass(false);
    }
  }, [open, editUser, isEdit]);

  if (!open) return null;

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim())  { toast.error('Name is required'); return; }
    if (!form.email.trim()) { toast.error('Email is required'); return; }
    if (!isEdit && !form.password) { toast.error('Password is required'); return; }
    if (form.password && form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }

    setSaving(true);
    try {
      let saved;
      if (isEdit) {
        const payload = { name: form.name, role: form.role, active: form.active };
        if (form.password) payload.password = form.password;
        const res = await API.put(`/auth/users/${editUser._id}`, payload);
        saved = res.data.user || res.data;
        toast.success('User updated!');
      } else {
        const res = await API.post('/auth/register', {
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        saved = res.data.user || res.data;
        toast.success('User created!');
      }
      onSaved(saved, isEdit ? 'edit' : 'add');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="text-lg font-bold text-navy-800">{isEdit ? 'Edit User' : 'Add New User'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="label">Full Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                className="input-field pl-10"
                placeholder="e.g. Ama Asante"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Email (read-only on edit) */}
          <div>
            <label className="label">Email <span className="text-red-500">*</span></label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                className={`input-field pl-10 ${isEdit ? 'bg-gray-50 text-gray-500 cursor-not-allowed' : ''}`}
                placeholder="e.g. ama@example.com"
                value={form.email}
                onChange={(e) => !isEdit && set('email', e.target.value)}
                readOnly={isEdit}
                required
              />
            </div>
            {isEdit && <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>}
          </div>

          {/* Password */}
          <div>
            <label className="label">
              {isEdit ? 'New Password (leave blank to keep current)' : 'Password *'}
            </label>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPass ? 'text' : 'password'}
                className="input-field pl-10 pr-11"
                placeholder={isEdit ? 'Leave blank to keep current…' : 'Min. 6 characters'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                minLength={form.password ? 6 : undefined}
              />
              <button
                type="button"
                onClick={() => setShowPass((s) => !s)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Role */}
          <div>
            <label className="label">Role</label>
            <select className="input-field" value={form.role} onChange={(e) => set('role', e.target.value)}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Active toggle (edit only) */}
          {isEdit && (
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-semibold text-navy-800 text-sm">Account Active</p>
                <p className="text-xs text-gray-500">Inactive users cannot log in</p>
              </div>
              <Toggle checked={form.active} onChange={(v) => set('active', v)} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" className="btn-secondary flex-1" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving && <Loader2 size={16} className="animate-spin" />}
              {isEdit ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── User card ─────────────────────────────────────────────────────────────────
const UserCard = ({ usr, currentUserId, onEdit }) => {
  const isMe = usr._id === currentUserId;
  const initials = usr.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
          usr.role === 'admin'
            ? 'bg-gradient-to-br from-blue-100 to-blue-200 text-blue-700'
            : 'bg-gradient-to-br from-pink-100 to-pink-200 text-pink-700'
        }`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-bold text-navy-800">{usr.name}</p>
            {isMe && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500 text-white text-xs font-semibold">
                You
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 truncate">{usr.email}</p>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <RoleBadge role={usr.role} />
            <StatusBadge active={usr.active ?? true} />
          </div>
          {usr.lastLogin && (
            <p className="text-xs text-gray-400 mt-1">Last login: {formatDateTime(usr.lastLogin)}</p>
          )}
        </div>

        {/* Edit */}
        <button
          onClick={() => onEdit(usr)}
          className="p-2 rounded-lg text-blue-500 hover:bg-blue-50 transition-colors shrink-0"
          title="Edit user"
        >
          <Pencil size={16} />
        </button>
      </div>
    </div>
  );
};

// ── Main component ────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { user: currentUser }   = useAuth();
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser]   = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.get('/auth/users');
      const rawList = res.data?.data || res.data?.users || res.data;
      const list = Array.isArray(rawList) ? rawList : [];
      setUsers(list);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to load users';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd  = () => { setEditUser(null); setModalOpen(true); };
  const openEdit = (u) => { setEditUser(u);   setModalOpen(true); };

  const handleSaved = (saved, mode) => {
    if (mode === 'add') {
      setUsers((prev) => [...prev, saved]);
    } else {
      setUsers((prev) => prev.map((u) => (u._id === saved._id ? saved : u)));
    }
  };

  // Sort: current user first, then admins, then staff
  const sortedUsers = [...users].sort((a, b) => {
    if (a._id === currentUser?._id) return -1;
    if (b._id === currentUser?._id) return  1;
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (b.role === 'admin' && a.role !== 'admin') return  1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const staffCount = users.filter((u) => u.role !== 'admin').length;

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="page-header flex items-center justify-between">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Shield size={24} className="text-blue-500" /> Users
          </h1>
          <p className="page-subtitle">
            {users.length} user{users.length !== 1 ? 's' : ''} · {adminCount} admin{adminCount !== 1 ? 's' : ''} · {staffCount} staff
          </p>
        </div>
        <button className="btn-primary" onClick={openAdd}>
          <UserPlus size={17} /> Add User
        </button>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="card mb-5 flex items-center gap-3 border-red-200 bg-red-50">
          <AlertCircle size={20} className="text-red-500 shrink-0" />
          <p className="text-red-700 text-sm font-medium flex-1">{error}</p>
          <button className="btn-secondary text-sm" onClick={fetchUsers}>Retry</button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card flex items-center gap-4">
              <Skeleton className="w-12 h-12 rounded-2xl shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48 mb-2" />
                <div className="flex gap-2"><Skeleton className="h-5 w-16 rounded-full" /><Skeleton className="h-5 w-16 rounded-full" /></div>
              </div>
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <Shield size={52} className="text-pink-200 mb-4" />
          <p className="font-semibold text-gray-500 text-lg">No users found</p>
          <p className="text-sm text-gray-400 mt-1 mb-5">Add the first user account</p>
          <button className="btn-primary" onClick={openAdd}><UserPlus size={17} /> Add User</button>
        </div>
      ) : (
        <>
          {/* Admin section */}
          {sortedUsers.filter((u) => u.role === 'admin').length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield size={12} /> Administrators
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedUsers.filter((u) => u.role === 'admin').map((u) => (
                  <UserCard key={u._id} usr={u} currentUserId={currentUser?._id} onEdit={openEdit} />
                ))}
              </div>
            </div>
          )}

          {/* Staff section */}
          {sortedUsers.filter((u) => u.role !== 'admin').length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <User size={12} /> Staff Members
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sortedUsers.filter((u) => u.role !== 'admin').map((u) => (
                  <UserCard key={u._id} usr={u} currentUserId={currentUser?._id} onEdit={openEdit} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal */}
      <UserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={handleSaved}
        editUser={editUser}
      />
    </div>
  );
}
