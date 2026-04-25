'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Camera,
  Save,
  RefreshCw,
  Users,
  Shield,
  Pencil,
  Navigation,
  CheckCircle2,
} from 'lucide-react';

type UserRole =
  | 'ADMIN'
  | 'OWNER'
  | 'FINANCE_MANAGER'
  | 'MARKETING_AGENT'
  | 'SALES_AGENT'
  | 'VIEWER'
  | 'POS_OPERATOR'
  | 'FINANCE_STAFF';

interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
}

interface MarketingVisitForm {
  id: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  siteName: string;
  locationDescription: string;
  latitude: number | null;
  longitude: number | null;
  photoUrl: string | null;
  knowsElegant: boolean;
  clientFeedback: string | null;
  routeName: string;
  editCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  createdByUser?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface CreateUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'MARKETING_AGENT' | 'SALES_AGENT' | 'VIEWER';
}

const emptyVisitState = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  siteName: '',
  locationDescription: '',
  latitude: '',
  longitude: '',
  knowsElegant: 'no',
  clientFeedback: '',
  routeName: '',
};

export default function MarketingVisitFormsPage() {
  const router = useRouter();

  const [token, setToken] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [forms, setForms] = useState<MarketingVisitForm[]>([]);
  const [search, setSearch] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [formState, setFormState] = useState({ ...emptyVisitState });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState({ ...emptyVisitState });
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);

  const [users, setUsers] = useState<Array<{ id: string; firstName: string; lastName: string; email: string; role: string }>>([]);
  const [userForm, setUserForm] = useState<CreateUserPayload>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'MARKETING_AGENT',
  });
  const [creatingUser, setCreatingUser] = useState(false);

  const isPrivileged =
    currentUser?.role === 'ADMIN' ||
    currentUser?.role === 'OWNER' ||
    currentUser?.role === 'FINANCE_MANAGER';

  const canSubmitMarketingForms =
    currentUser?.role === 'MARKETING_AGENT' ||
    currentUser?.role === 'SALES_AGENT' ||
    isPrivileged;

  const filteredForms = useMemo(() => {
    if (!search.trim()) return forms;
    const term = search.trim().toLowerCase();
    return forms.filter((item) => {
      return (
        item.customerName.toLowerCase().includes(term) ||
        item.siteName.toLowerCase().includes(term) ||
        item.routeName.toLowerCase().includes(term) ||
        item.locationDescription.toLowerCase().includes(term)
      );
    });
  }, [forms, search]);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (!storedToken || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser) as CurrentUser;
      setCurrentUser(parsedUser);
      setToken(storedToken);
    } catch {
      router.push('/login');
    }
  }, [router]);

  useEffect(() => {
    if (!token) return;

    const run = async () => {
      setLoading(true);
      await Promise.all([fetchForms(token), fetchUsers(token)]);
      setLoading(false);
    };

    run().catch(() => {
      setLoading(false);
    });
  }, [token]);

  const fetchForms = async (authToken: string) => {
    try {
      const response = await fetch('/api/marketing-visit-forms', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Failed to load marketing forms');
      }

      setForms(payload?.data?.forms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load marketing forms');
    }
  };

  const fetchUsers = async (authToken: string) => {
    if (!isPrivileged) return;

    try {
      const response = await fetch('/api/admin/users', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      setUsers(payload?.data?.users || []);
    } catch {
      // Silent fail for user list panel
    }
  };

  const buildFormData = (state: typeof emptyVisitState, file: File | null) => {
    const data = new FormData();
    data.append('customerName', state.customerName);
    data.append('customerPhone', state.customerPhone);
    data.append('customerEmail', state.customerEmail);
    data.append('siteName', state.siteName);
    data.append('locationDescription', state.locationDescription);
    data.append('latitude', state.latitude);
    data.append('longitude', state.longitude);
    data.append('knowsElegant', state.knowsElegant === 'yes' ? 'true' : 'false');
    data.append('clientFeedback', state.clientFeedback);
    data.append('routeName', state.routeName);
    if (file) {
      data.append('photo', file);
    }
    return data;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch('/api/marketing-visit-forms', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: buildFormData(formState, photoFile),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Failed to submit form');
      }

      setSuccess('Marketing visit form submitted successfully.');
      setFormState({ ...emptyVisitState });
      setPhotoFile(null);
      await fetchForms(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit form');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item: MarketingVisitForm) => {
    setEditingId(item.id);
    setEditState({
      customerName: item.customerName,
      customerPhone: item.customerPhone || '',
      customerEmail: item.customerEmail || '',
      siteName: item.siteName,
      locationDescription: item.locationDescription,
      latitude: item.latitude?.toString() || '',
      longitude: item.longitude?.toString() || '',
      knowsElegant: item.knowsElegant ? 'yes' : 'no',
      clientFeedback: item.clientFeedback || '',
      routeName: item.routeName,
    });
    setEditPhotoFile(null);
  };

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) return;

    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const response = await fetch(`/api/marketing-visit-forms/${editingId}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: buildFormData(editState, editPhotoFile),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Failed to update form');
      }

      setSuccess('Form updated successfully.');
      setEditingId(null);
      setEditPhotoFile(null);
      await fetchForms(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update form');
    } finally {
      setSaving(false);
    }
  };

  const useCurrentLocation = (setter: React.Dispatch<React.SetStateAction<typeof emptyVisitState>>) => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported on this device.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setter((prev) => ({
          ...prev,
          latitude: String(position.coords.latitude),
          longitude: String(position.coords.longitude),
        }));
      },
      () => {
        setError('Unable to retrieve location. Please allow location permission.');
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
      }
    );
  };

  const handleCreateUser = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isPrivileged) return;

    setError('');
    setSuccess('');
    setCreatingUser(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userForm),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message || 'Failed to create user');
      }

      setSuccess('User account created successfully.');
      setUserForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'MARKETING_AGENT',
      });
      await fetchUsers(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="flex items-center gap-2 text-slate-700">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading marketing workspace...</span>
        </div>
      </div>
    );
  }

  if (!canSubmitMarketingForms) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
          <h1 className="text-xl font-semibold text-rose-700">Access restricted</h1>
          <p className="text-rose-700/80 mt-2">
            This page is for marketing and sales form capture only. Ask an administrator to assign
            your role.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,_#e0f2fe,_transparent_40%),radial-gradient(circle_at_bottom_left,_#dcfce7,_transparent_35%),#f8fafc] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="rounded-2xl border border-sky-200/70 bg-white/90 backdrop-blur p-6 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Marketing Customer Visit Form</h1>
              <p className="text-slate-600 mt-1">
                Capture customer contact, exact location, site photo, awareness and feedback in one flow.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700">
              <Shield className="h-4 w-4" />
              Signed in as {currentUser.firstName} ({currentUser.role})
            </div>
          </div>
        </div>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">{error}</div>
        ) : null}

        {success ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">New Visit Submission</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Customer full name"
                  value={formState.customerName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, customerName: e.target.value }))}
                  required
                />
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Customer phone"
                  value={formState.customerPhone}
                  onChange={(e) => setFormState((prev) => ({ ...prev, customerPhone: e.target.value }))}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="email"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Customer email"
                  value={formState.customerEmail}
                  onChange={(e) => setFormState((prev) => ({ ...prev, customerEmail: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Site name"
                  value={formState.siteName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, siteName: e.target.value }))}
                  required
                />
              </div>

              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-20"
                placeholder="Location description"
                value={formState.locationDescription}
                onChange={(e) => setFormState((prev) => ({ ...prev, locationDescription: e.target.value }))}
                required
              />

              <div className="grid md:grid-cols-3 gap-4">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Latitude"
                  value={formState.latitude}
                  onChange={(e) => setFormState((prev) => ({ ...prev, latitude: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Longitude"
                  value={formState.longitude}
                  onChange={(e) => setFormState((prev) => ({ ...prev, longitude: e.target.value }))}
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-300 bg-sky-50 px-4 py-2 text-sky-700 hover:bg-sky-100"
                  onClick={() => useCurrentLocation(setFormState)}
                >
                  <Navigation className="h-4 w-4" />
                  Use geolocation
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  placeholder="Route name"
                  value={formState.routeName}
                  onChange={(e) => setFormState((prev) => ({ ...prev, routeName: e.target.value }))}
                  required
                />
                <select
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                  value={formState.knowsElegant}
                  onChange={(e) => setFormState((prev) => ({ ...prev, knowsElegant: e.target.value }))}
                >
                  <option value="no">Client knows about Elegant: No</option>
                  <option value="yes">Client knows about Elegant: Yes</option>
                </select>
              </div>

              <textarea
                className="w-full rounded-lg border border-slate-300 px-3 py-2 min-h-24"
                placeholder="Client feedback"
                value={formState.clientFeedback}
                onChange={(e) => setFormState((prev) => ({ ...prev, clientFeedback: e.target.value }))}
              />

              <label className="flex items-center gap-3 rounded-lg border border-slate-300 px-3 py-2">
                <Camera className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-700">Place photo (shop/surroundings)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="ml-auto text-sm"
                />
              </label>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-slate-900 text-white px-5 py-2.5 hover:bg-slate-800 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {saving ? 'Submitting...' : 'Submit form'}
              </button>
            </form>
          </section>

          <section className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Submission Rules</h2>
            <ul className="text-sm text-slate-700 space-y-2">
              <li className="flex gap-2"><MapPin className="h-4 w-4 mt-0.5 text-sky-600" />Location and coordinates should be as exact as possible.</li>
              <li className="flex gap-2"><Users className="h-4 w-4 mt-0.5 text-sky-600" />Marketing and sales users can only view their own submitted forms.</li>
              <li className="flex gap-2"><Shield className="h-4 w-4 mt-0.5 text-sky-600" />Owner/admin can view all submissions in this module.</li>
              <li className="flex gap-2"><Pencil className="h-4 w-4 mt-0.5 text-sky-600" />Each submitted form can be edited only once for non-admin users.</li>
            </ul>
          </section>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">Submitted Forms</h2>
            <input
              className="rounded-lg border border-slate-300 px-3 py-2 w-full md:w-80"
              placeholder="Search by customer, site, route, location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {filteredForms.length === 0 ? (
            <p className="text-slate-500">No forms found.</p>
          ) : (
            <div className="grid gap-4">
              {filteredForms.map((item) => {
                const canEdit =
                  isPrivileged ||
                  (item.createdBy === currentUser.id && item.editCount < 1);

                return (
                  <article key={item.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{item.customerName} at {item.siteName}</h3>
                        <p className="text-sm text-slate-600">Route: {item.routeName}</p>
                        <p className="text-sm text-slate-600">Location: {item.locationDescription}</p>
                        <p className="text-sm text-slate-600">
                          Coordinates: {item.latitude ?? '-'}, {item.longitude ?? '-'}
                        </p>
                        <p className="text-sm text-slate-600">
                          Knows Elegant: {item.knowsElegant ? 'Yes' : 'No'}
                        </p>
                        {item.clientFeedback ? (
                          <p className="text-sm text-slate-700 mt-2">Feedback: {item.clientFeedback}</p>
                        ) : null}
                      </div>

                      <div className="flex flex-col items-start md:items-end gap-2">
                        <span className="text-xs rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                          Edited {item.editCount}/1
                        </span>
                        {item.createdByUser ? (
                          <span className="text-xs text-slate-500">
                            By {item.createdByUser.firstName} {item.createdByUser.lastName}
                          </span>
                        ) : null}
                        {canEdit ? (
                          <button
                            onClick={() => startEdit(item)}
                            className="inline-flex items-center gap-1 text-sm rounded-md border border-slate-300 px-2.5 py-1.5 hover:bg-slate-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </button>
                        ) : null}
                      </div>
                    </div>

                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={`Site photo for ${item.siteName}`}
                        className="mt-3 rounded-lg border border-slate-200 max-h-56 object-cover"
                      />
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {editingId ? (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-amber-900 mb-3">Edit Form</h2>
            <form onSubmit={submitEdit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <input
                  className="w-full rounded-lg border border-amber-300 px-3 py-2"
                  placeholder="Customer full name"
                  value={editState.customerName}
                  onChange={(e) => setEditState((prev) => ({ ...prev, customerName: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-amber-300 px-3 py-2"
                  placeholder="Customer phone"
                  value={editState.customerPhone}
                  onChange={(e) => setEditState((prev) => ({ ...prev, customerPhone: e.target.value }))}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  className="w-full rounded-lg border border-amber-300 px-3 py-2"
                  placeholder="Site name"
                  value={editState.siteName}
                  onChange={(e) => setEditState((prev) => ({ ...prev, siteName: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-amber-300 px-3 py-2"
                  placeholder="Route name"
                  value={editState.routeName}
                  onChange={(e) => setEditState((prev) => ({ ...prev, routeName: e.target.value }))}
                />
              </div>

              <textarea
                className="w-full rounded-lg border border-amber-300 px-3 py-2 min-h-20"
                placeholder="Location description"
                value={editState.locationDescription}
                onChange={(e) => setEditState((prev) => ({ ...prev, locationDescription: e.target.value }))}
              />

              <div className="grid md:grid-cols-3 gap-4">
                <input
                  className="w-full rounded-lg border border-amber-300 px-3 py-2"
                  placeholder="Latitude"
                  value={editState.latitude}
                  onChange={(e) => setEditState((prev) => ({ ...prev, latitude: e.target.value }))}
                />
                <input
                  className="w-full rounded-lg border border-amber-300 px-3 py-2"
                  placeholder="Longitude"
                  value={editState.longitude}
                  onChange={(e) => setEditState((prev) => ({ ...prev, longitude: e.target.value }))}
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 py-2 text-amber-900 hover:bg-amber-100"
                  onClick={() => useCurrentLocation(setEditState)}
                >
                  <Navigation className="h-4 w-4" />
                  Refresh location
                </button>
              </div>

              <textarea
                className="w-full rounded-lg border border-amber-300 px-3 py-2 min-h-20"
                placeholder="Client feedback"
                value={editState.clientFeedback}
                onChange={(e) => setEditState((prev) => ({ ...prev, clientFeedback: e.target.value }))}
              />

              <div className="grid md:grid-cols-2 gap-4">
                <select
                  className="w-full rounded-lg border border-amber-300 px-3 py-2"
                  value={editState.knowsElegant}
                  onChange={(e) => setEditState((prev) => ({ ...prev, knowsElegant: e.target.value }))}
                >
                  <option value="no">Client knows about Elegant: No</option>
                  <option value="yes">Client knows about Elegant: Yes</option>
                </select>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full rounded-lg border border-amber-300 px-3 py-2"
                  onChange={(e) => setEditPhotoFile(e.target.files?.[0] || null)}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-lg bg-amber-600 text-white px-4 py-2 hover:bg-amber-700 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  {saving ? 'Saving...' : 'Save one-time edit'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="rounded-lg border border-amber-300 px-4 py-2 text-amber-900 hover:bg-amber-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          </section>
        ) : null}

        {isPrivileged ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Admin: Create Marketing Team Accounts</h2>
            <form onSubmit={handleCreateUser} className="grid md:grid-cols-5 gap-3 mb-6">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="First name"
                value={userForm.firstName}
                onChange={(e) => setUserForm((prev) => ({ ...prev, firstName: e.target.value }))}
                required
              />
              <input
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Last name"
                value={userForm.lastName}
                onChange={(e) => setUserForm((prev) => ({ ...prev, lastName: e.target.value }))}
                required
              />
              <input
                type="email"
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Email"
                value={userForm.email}
                onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                required
              />
              <input
                type="password"
                className="rounded-lg border border-slate-300 px-3 py-2"
                placeholder="Temporary password"
                value={userForm.password}
                onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                required
              />
              <div className="flex gap-2">
                <select
                  className="rounded-lg border border-slate-300 px-3 py-2 flex-1"
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm((prev) => ({
                      ...prev,
                      role: e.target.value as CreateUserPayload['role'],
                    }))
                  }
                >
                  <option value="MARKETING_AGENT">Marketing agent</option>
                  <option value="SALES_AGENT">Sales agent</option>
                  <option value="VIEWER">Viewer</option>
                </select>
                <button
                  type="submit"
                  disabled={creatingUser}
                  className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-50"
                >
                  {creatingUser ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-slate-200">
                    <th className="py-2">Name</th>
                    <th className="py-2">Email</th>
                    <th className="py-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-2">{item.firstName} {item.lastName}</td>
                      <td className="py-2">{item.email}</td>
                      <td className="py-2">{item.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
