import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyTasksSection({ user }) {
  const [tasks, setTasks] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Task Assign Modal State
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedGroupId, setSelectedGroupId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [groupMembers, setGroupMembers] = useState([])
  const [taskDescription, setTaskDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTasksData = () => {
    if (!user || !user.uid) return
    setLoading(true)

    // Fetch tasks for faculty supervised groups
    fetch(`${API_BASE_URL}/api/faculty/tasks/${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setTasks(data.tasks || [])
        } else {
          setError(data.message || 'Failed to load tasks.')
        }
      })
      .catch(() => setError('Failed to connect to tasks server.'))
      .finally(() => setLoading(false))

    // Fetch supervised groups for task assignment dropdown
    fetch(`${API_BASE_URL}/api/faculty/groups/${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.groups) {
          setGroups(data.groups)
          if (data.groups.length > 0 && !selectedGroupId) {
            setSelectedGroupId(data.groups[0].group_id)
            setGroupMembers(data.groups[0].members || [])
            if (data.groups[0].members?.length > 0) {
              setSelectedStudentId(data.groups[0].members[0].student_id)
            }
          }
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchTasksData()
  }, [user?.uid])

  // Handle changing group selection in assign modal
  const handleGroupChange = (gid) => {
    setSelectedGroupId(gid)
    const targetGroup = groups.find((g) => g.group_id === Number(gid))
    if (targetGroup) {
      setGroupMembers(targetGroup.members || [])
      if (targetGroup.members?.length > 0) {
        setSelectedStudentId(targetGroup.members[0].student_id)
      } else {
        setSelectedStudentId('')
      }
    }
  }

  const handleAssignTask = async (e) => {
    e.preventDefault()
    if (!selectedGroupId || !selectedStudentId || !taskDescription.trim()) return
    setSubmitting(true)
    setStatusMsg('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/faculty/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faculty_id: user.uid,
          group_id: Number(selectedGroupId),
          assigned_to: Number(selectedStudentId),
          task_description: taskDescription.trim(),
          deadline: deadline || null
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setStatusMsg('Task assigned successfully to student!')
        setShowAssignModal(false)
        setTaskDescription('')
        setDeadline('')
        fetchTasksData()
      } else {
        setStatusMsg(data.message || 'Failed to assign task.')
      }
    } catch {
      setStatusMsg('Failed to assign task.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Assign Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-950">Thesis Tasks Management</h2>
          <p className="text-slate-500 text-xs mt-1">
            Assign tasks to students in your supervised thesis groups and monitor completion status
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAssignModal(true)}
          className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
        >
          + Assign Task To Student
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-semibold flex justify-between items-center">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg('')} className="text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-2xl text-center">
          {error}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs font-medium">
          No tasks assigned in your supervised thesis groups yet. Click "+ Assign Task To Student" above.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((t) => {
            const isCompleted = t.status === 'Completed'
            const isInProgress = t.status === 'In Progress'

            return (
              <div
                key={t.task_id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-sky-100 text-sky-950 font-bold rounded-full text-xs">
                      Task #{t.task_id} • Group #{t.group_id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-900'
                          : isInProgress
                          ? 'bg-blue-100 text-blue-900'
                          : 'bg-amber-100 text-amber-900'
                      }`}
                    >
                      Status: {t.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{t.thesis_title}</h3>
                    <p className="text-xs font-semibold text-blue-950 mt-1">
                      Assigned To: <span className="text-slate-900 font-bold">{t.student_name}</span> ({t.student_email})
                    </p>
                  </div>

                  <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-100 leading-relaxed">
                    {t.task_description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-bold">Deadline:</span>
                  <span className="font-extrabold text-rose-900 bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                    {t.formatted_deadline || t.deadline || 'No deadline set'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ASSIGN TASK MODAL */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleAssignTask}
            className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Assign New Task</h3>
                <p className="text-xs text-slate-500">Assign a plain text task with a deadline to a student</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Thesis Group</label>
                {groups.length === 0 ? (
                  <p className="text-rose-600">No supervised groups available.</p>
                ) : (
                  <select
                    value={selectedGroupId}
                    onChange={(e) => handleGroupChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-900"
                    required
                  >
                    {groups.map((g) => (
                      <option key={g.group_id} value={g.group_id}>
                        Group #{g.group_id} - {g.title.slice(0, 30)}...
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Select Student Member</label>
                {groupMembers.length === 0 ? (
                  <p className="text-rose-600">No members found in this group.</p>
                ) : (
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-900"
                    required
                  >
                    {groupMembers.map((m) => (
                      <option key={m.student_id} value={m.student_id}>
                        {m.name} (CGPA: {m.CGPA})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Task Description (Plain Text)</label>
                <textarea
                  rows="4"
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="e.g. Complete Literature Review section 2.1 and submit draft PDF..."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Deadline Date & Time</label>
                <input
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                  required
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || groupMembers.length === 0}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Assigning...' : 'Assign Task'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
