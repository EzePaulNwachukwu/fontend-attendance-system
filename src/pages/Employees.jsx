// src/pages/Employees.jsx
// Admin page: list, search, add, edit, deactivate and reactivate employees.

import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { getUsers, updateUser, deactivateUser } from '../api/userApi'
import { registerUser } from '../api/authApi'
import { getErrorMessage } from '../utils/format'
import { DEPARTMENTS } from '../utils/constants'
import useDebounce from '../hooks/useDebounce'
import Spinner from '../components/Spinner'
import ErrorMessage from '../components/ErrorMessage'
import EmptyState from '../components/EmptyState'
import StatusBadge from '../components/StatusBadge'
import Pagination from '../components/Pagination'
import Modal from '../components/Modal'

const MIN_PASSWORD = 8

// Empty values for the "Add employee" form.
const EMPTY_NEW_USER = {
  name: '',
  username: '',
  staffId: '',
  department: '',
  position: '',
  role: 'staff',
  password: '',
}

export default function Employees() {
  const { user: currentUser } = useAuth()
  const toast = useToast()

  // Filters
  const [search, setSearch] = useState('')
  const [department, setDepartment] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('') // '', 'true' (active) or 'false' (inactive)
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 400)

  // Data
  const [users, setUsers] = useState([])
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadCount, setReloadCount] = useState(0) // bump to reload the list

  // Modals: which one is open, and for which user
  const [addOpen, setAddOpen] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [deactivateTarget, setDeactivateTarget] = useState(null)
  const [busy, setBusy] = useState(false) // a save/deactivate request is running

  // Load the list whenever a filter, the page, or reloadCount changes.
  useEffect(() => {
    let ignore = false
    setLoading(true)
    setError('')
    getUsers({
      page,
      limit: 10,
      sort: 'staffId',
      department,
      role,
      isActive: status,
      'name[regex]': debouncedSearch.trim(),
    })
      .then((res) => {
        if (ignore) return
        setUsers(res.data)
        setPagination(res.pagination)
      })
      .catch((err) => {
        if (!ignore) setError(getErrorMessage(err))
      })
      .finally(() => {
        if (!ignore) setLoading(false)
      })
    return () => {
      ignore = true
    }
  }, [page, department, role, status, debouncedSearch, reloadCount])

  const reload = () => setReloadCount((n) => n + 1)

  // Changing a filter always goes back to page 1.
  const changeFilter = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  // Reactivate needs no confirmation: it is easy to undo.
  const handleReactivate = async (u) => {
    try {
      await updateUser(u._id, { isActive: true })
      toast.success(`${u.name} has been reactivated`)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const handleDeactivate = async () => {
    setBusy(true)
    try {
      const res = await deactivateUser(deactivateTarget._id)
      toast.success(res.message)
      setDeactivateTarget(null)
      reload()
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Employees</h1>
          <p className="text-sm text-slate-500">Create and manage staff accounts.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setAddOpen(true)}>
          Add employee
        </button>
      </div>

      {/* Filters */}
      <div className="card grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="search" className="label">
            Search by name
          </label>
          <input
            id="search"
            type="search"
            className="input"
            placeholder="e.g. Ngozi"
            value={search}
            onChange={changeFilter(setSearch)}
          />
        </div>
        <div>
          <label htmlFor="department" className="label">
            Department
          </label>
          <select id="department" className="input" value={department} onChange={changeFilter(setDepartment)}>
            <option value="">All departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="role" className="label">
            Role
          </label>
          <select id="role" className="input" value={role} onChange={changeFilter(setRole)}>
            <option value="">All roles</option>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label htmlFor="status" className="label">
            Status
          </label>
          <select id="status" className="input" value={status} onChange={changeFilter(setStatus)}>
            <option value="">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        {loading && users.length === 0 ? (
          <Spinner label="Loading employees" />
        ) : error ? (
          <div className="p-4">
            <ErrorMessage message={error} onRetry={reload} />
          </div>
        ) : users.length === 0 ? (
          <EmptyState title="No employees found" message="Try changing the filters." />
        ) : (
          <>
            <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Staff ID</th>
                    <th scope="col">Username</th>
                    <th scope="col">Department</th>
                    <th scope="col">Position</th>
                    <th scope="col">Role</th>
                    <th scope="col">Status</th>
                    <th scope="col">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isMe = u._id === currentUser?._id
                    return (
                      <tr key={u._id}>
                        <td className="font-medium text-slate-900">
                          {u.name} {isMe && <span className="text-xs font-normal text-slate-500">(you)</span>}
                        </td>
                        <td>{u.staffId}</td>
                        <td>{u.username}</td>
                        <td>{u.department || '-'}</td>
                        <td>{u.position || '-'}</td>
                        <td>
                          <StatusBadge status={u.role} />
                        </td>
                        <td>
                          <StatusBadge status={u.isActive ? 'active' : 'inactive'} />
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditUser(u)}>
                              Edit
                            </button>
                            {/* An admin can't deactivate their own account */}
                            {!isMe &&
                              (u.isActive ? (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm text-red-700"
                                  onClick={() => setDeactivateTarget(u)}
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="btn btn-secondary btn-sm text-green-700"
                                  onClick={() => handleReactivate(u)}
                                >
                                  Reactivate
                                </button>
                              ))}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={pagination.page}
              totalPages={pagination.totalPages}
              totalCount={pagination.totalCount}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {/* Add employee */}
      <Modal open={addOpen} title="Add employee" onClose={() => setAddOpen(false)}>
        <AddEmployeeForm
          onCancel={() => setAddOpen(false)}
          onSaved={(newUser) => {
            toast.success(`${newUser.name} has been added`)
            setAddOpen(false)
            reload()
          }}
        />
      </Modal>

      {/* Edit employee. "key" makes React start a fresh form for each user. */}
      <Modal open={Boolean(editUser)} title="Edit employee" onClose={() => setEditUser(null)}>
        {editUser && (
          <EditEmployeeForm
            key={editUser._id}
            employee={editUser}
            isMe={editUser._id === currentUser?._id}
            onCancel={() => setEditUser(null)}
            onSaved={(updated) => {
              toast.success(`${updated.name} has been updated`)
              setEditUser(null)
              reload()
            }}
          />
        )}
      </Modal>

      {/* Deactivate confirmation */}
      <Modal open={Boolean(deactivateTarget)} title="Deactivate employee" onClose={() => setDeactivateTarget(null)}>
        <p className="text-sm text-slate-700">
          Deactivate <strong>{deactivateTarget?.name}</strong>? They will no longer be able to log in. Their attendance
          history is kept, and you can reactivate them later.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" className="btn btn-secondary" onClick={() => setDeactivateTarget(null)}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={handleDeactivate} disabled={busy}>
            {busy ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ---------------------------------------------------------------------------
// The "Add employee" form (calls POST /api/auth/register)
// ---------------------------------------------------------------------------
function AddEmployeeForm({ onCancel, onSaved }) {
  const [form, setForm] = useState(EMPTY_NEW_USER)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // One change handler for every field: uses the input's "name" attribute.
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < MIN_PASSWORD) {
      setError(`Password must be at least ${MIN_PASSWORD} characters.`)
      return
    }
    setSaving(true)
    try {
      const newUser = await registerUser(form)
      onSaved(newUser)
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="add-name" className="label">
          Full name
        </label>
        <input id="add-name" name="name" className="input" value={form.name} onChange={handleChange} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="add-username" className="label">
            Username
          </label>
          <input
            id="add-username"
            name="username"
            className="input"
            value={form.username}
            onChange={handleChange}
            autoCapitalize="none"
            autoComplete="off"
            required
          />
        </div>
        <div>
          <label htmlFor="add-staffId" className="label">
            Staff ID
          </label>
          <input
            id="add-staffId"
            name="staffId"
            className="input"
            value={form.staffId}
            onChange={handleChange}
            aria-describedby="staffId-hint"
            required
          />
          <p id="staffId-hint" className="mt-1 text-xs text-slate-500">
            e.g. SP-014
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="add-department" className="label">
            Department
          </label>
          <select id="add-department" name="department" className="input" value={form.department} onChange={handleChange}>
            <option value="">Select a department</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="add-position" className="label">
            Position
          </label>
          <input id="add-position" name="position" className="input" value={form.position} onChange={handleChange} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="add-role" className="label">
            Role
          </label>
          <select id="add-role" name="role" className="input" value={form.role} onChange={handleChange}>
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <div>
          <label htmlFor="add-password" className="label">
            Password
          </label>
          <input
            id="add-password"
            name="password"
            type="password"
            className="input"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            aria-describedby="password-hint"
            required
          />
          <p id="password-hint" className="mt-1 text-xs text-slate-500">
            At least {MIN_PASSWORD} characters
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Add employee'}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------------------
// The "Edit employee" form (calls PUT /api/users/:id)
// ---------------------------------------------------------------------------
function EditEmployeeForm({ employee, isMe, onCancel, onSaved }) {
  const [form, setForm] = useState({
    name: employee.name,
    department: employee.department || '',
    position: employee.position || '',
    role: employee.role,
    isActive: employee.isActive,
    password: '',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    // Checkboxes use "checked" (true/false) instead of "value".
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password && form.password.length < MIN_PASSWORD) {
      setError(`New password must be at least ${MIN_PASSWORD} characters.`)
      return
    }

    // Only send the password if the admin typed a new one.
    const { password, ...updates } = form
    if (password) updates.password = password

    setSaving(true)
    try {
      const updated = await updateUser(employee._id, updates)
      onSaved(updated)
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Username and staff ID can't be changed, so they are shown as text. */}
      <dl className="grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-3 text-sm">
        <div>
          <dt className="text-slate-500">Username</dt>
          <dd className="font-medium text-slate-900">{employee.username}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Staff ID</dt>
          <dd className="font-medium text-slate-900">{employee.staffId}</dd>
        </div>
      </dl>

      <div>
        <label htmlFor="edit-name" className="label">
          Full name
        </label>
        <input id="edit-name" name="name" className="input" value={form.name} onChange={handleChange} required />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-department" className="label">
            Department
          </label>
          <select id="edit-department" name="department" className="input" value={form.department} onChange={handleChange}>
            <option value="">No department</option>
            {/* Keep a department that isn't in our list (e.g. "Management") selectable */}
            {form.department && !DEPARTMENTS.includes(form.department) && (
              <option value={form.department}>{form.department}</option>
            )}
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="edit-position" className="label">
            Position
          </label>
          <input id="edit-position" name="position" className="input" value={form.position} onChange={handleChange} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="edit-role" className="label">
            Role
          </label>
          {/* An admin can't change their own role (they could lock themselves out). */}
          <select
            id="edit-role"
            name="role"
            className="input"
            value={form.role}
            onChange={handleChange}
            disabled={isMe}
            aria-describedby={isMe ? 'role-hint' : undefined}
          >
            <option value="staff">Staff</option>
            <option value="admin">Admin</option>
          </select>
          {isMe && (
            <p id="role-hint" className="mt-1 text-xs text-slate-500">
              You can't change your own role.
            </p>
          )}
        </div>
        <div>
          <label htmlFor="edit-password" className="label">
            New password <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="edit-password"
            name="password"
            type="password"
            className="input"
            value={form.password}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder="Leave blank to keep"
          />
        </div>
      </div>

      {/* An admin can't deactivate themselves, so hide the toggle on their own account. */}
      {!isMe && (
        <label className="flex items-center gap-3 text-sm text-slate-700">
          <input
            type="checkbox"
            name="isActive"
            checked={form.isActive}
            onChange={handleChange}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Account is active
        </label>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  )
}
