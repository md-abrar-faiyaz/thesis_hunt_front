import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyThesisGroupSection({ user }) {
  const [groups, setGroups] = useState([])
  const [roleFilter, setRoleFilter] = useState('all') // 'all', 'supervisor', 'co-supervisor'
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedGroupModal, setSelectedGroupModal] = useState(null)

  const fetchGroups = () => {
    if (!user || !user.uid) return
    setLoading(true)
    let url = `${API_BASE_URL}/api/faculty/groups/${user.uid}`
    if (roleFilter !== 'all') {
      url += `?role=${roleFilter}`
    }
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setGroups(data.groups || [])
        } else {
          setError(data.message || 'Failed to load thesis groups.')
        }
      })
      .catch(() => setError('Failed to connect to backend server.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchGroups()
  }, [user?.uid, roleFilter])

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Role Filter Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-950">Supervised Thesis Groups</h2>
          <p className="text-slate-500 text-xs mt-1">
            View groups where you serve as Primary Supervisor or Co-Supervisor
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'all'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-950'
            }`}
          >
            All Groups ({groups.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('supervisor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'supervisor'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-950'
            }`}
          >
            As Supervisor
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('co-supervisor')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              roleFilter === 'co-supervisor'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-950'
            }`}
          >
            As Co-Supervisor
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-2xl text-center">
          {error}
        </div>
      ) : groups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500">
          No thesis groups found under the selected view.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {groups.map((g) => (
            <div
              key={g.group_id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="px-3 py-1 bg-sky-100 text-sky-900 rounded-full text-xs font-extrabold uppercase">
                    Group #{g.group_id}
                  </span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      g.faculty_role?.toLowerCase() === 'supervisor'
                        ? 'bg-blue-950 text-white'
                        : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    }`}
                  >
                    Role: {g.faculty_role || 'Supervisor'}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 leading-snug">{g.title}</h3>
                  <p className="text-xs text-sky-900 font-semibold mt-1">Domain: {g.domain}</p>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {g.description || 'No description provided.'}
                </p>

                {/* Group Members Preview */}
                <div>
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Members ({g.members?.length || 0})
                  </h4>
                  <div className="space-y-2">
                    {g.members?.map((m) => (
                      <div
                        key={m.student_id}
                        className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 block">{m.name}</span>
                          <span className="text-[11px] text-slate-500">
                            Sem {m.sem_no} • {m.credits_completed} Credits (
                            <span className="font-semibold text-blue-900">
                              {m.credits_per_sem} cr/sem
                            </span>
                            )
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-blue-950 block">
                            CGPA: {m.CGPA !== undefined ? m.CGPA.toFixed(2) : 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400">#{m.student_id}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supervisors list */}
                {g.supervisors && g.supervisors.length > 0 && (
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Faculty Supervision Team
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {g.supervisors.map((s) => (
                        <span
                          key={s.supervisor_id}
                          className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-800"
                        >
                          {s.name} ({s.role})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSelectedGroupModal(g)}
                className="w-full mt-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-blue-950 font-bold text-xs rounded-xl transition-all"
              >
                View Full Group Details
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Full Group Details Modal */}
      {selectedGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="px-3 py-1 bg-sky-100 text-sky-900 font-extrabold rounded-full text-xs uppercase">
                  Thesis Group #{selectedGroupModal.group_id}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  {selectedGroupModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGroupModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Domain</h4>
              <p className="text-sm font-semibold text-blue-950">{selectedGroupModal.domain}</p>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Description</h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                {selectedGroupModal.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Members & Academic Details
              </h4>
              <div className="space-y-3">
                {selectedGroupModal.members?.map((m) => (
                  <div
                    key={m.student_id}
                    className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between gap-2"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{m.name}</h5>
                      <p className="text-xs text-slate-500">{m.email}</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Gender: <span className="font-semibold text-slate-800">{m.gender || 'N/A'}</span> • Semester: <span className="font-semibold text-slate-800">{m.sem_no}</span>
                      </p>
                    </div>
                    <div className="sm:text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                      <div className="text-sm font-extrabold text-blue-900">
                        CGPA: {m.CGPA !== undefined ? m.CGPA.toFixed(2) : 'N/A'}
                      </div>
                      <div className="text-xs text-slate-600">
                        Credits: {m.credits_completed} total
                      </div>
                      <div className="text-xs font-bold text-emerald-800">
                        {m.credits_per_sem} cr / semester
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedGroupModal(null)}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Close Modal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
