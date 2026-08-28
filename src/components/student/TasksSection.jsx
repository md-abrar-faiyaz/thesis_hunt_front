import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function TasksSection({ user }) {
  const [taskData, setTaskData] = useState({
    group_members: [],
    requests: [],
    in_progress_supervisor: [],
    in_progress_members: [],
    completed_supervisor: [],
    completed_members: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [taskDescription, setTaskDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [creating, setCreating] = useState(false)
  const [modalError, setModalError] = useState('')

  // Action Loading State
  const [actionTaskId, setActionTaskId] = useState(null)

  const fetchTasks = useCallback(() => {
    if (!user || !user.uid) return

    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/api/student/tasks?student_id=${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setTaskData({
            group_members: data.group_members || [],
            requests: data.requests || [],
            in_progress_supervisor: data.in_progress_supervisor || [],
            in_progress_members: data.in_progress_members || [],
            completed_supervisor: data.completed_supervisor || [],
            completed_members: data.completed_members || []
          })

          if (data.group_members && data.group_members.length > 0) {
            setAssignedTo(data.group_members[0].student_id)
          }
        } else {
          setError(data.message || 'Failed to load task data.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to backend server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault()
    if (!taskDescription.trim() || !assignedTo || !user || !user.uid) {
      setModalError('Please fill out all required fields.')
      return
    }

    setCreating(true)
    setModalError('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/student/task`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_description: taskDescription.trim(),
          deadline: deadline || null,
          assigned_to: parseInt(assignedTo),
          assigned_by: user.uid
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        setIsModalOpen(false)
        setTaskDescription('')
        setDeadline('')
        fetchTasks()
      } else {
        setModalError(data.message || 'Failed to create task.')
      }
    } catch (err) {
      setModalError('Network error: Failed to connect to backend server.')
    } finally {
      setCreating(false)
    }
  }

  const handleTaskAction = async (taskId, action) => {
    if (!user || !user.uid) return

    setActionTaskId(taskId)
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/task/${taskId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          user_id: user.uid
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        fetchTasks()
      } else {
        alert(data.message || 'Failed to update task action.')
      }
    } catch (err) {
      alert('Network error: Unable to process task action.')
    } finally {
      setActionTaskId(null)
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Project & Thesis Workflow
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">Tasks</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Manage pending requests, track active progress, and review completed thesis milestones.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setModalError('')
            setIsModalOpen(true)
          }}
          className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add New Task</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      ) : (
        <div className="space-y-10">
          {/* SECTION 1: Task Requests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-black uppercase tracking-wider">
                  Task Requests
                </h3>
                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-0.5 rounded-full text-xs">
                  {taskData.requests.length} Pending
                </span>
              </div>
            </div>

            {taskData.requests.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs font-medium text-slate-500 shadow-xs">
                No pending task requests at the moment.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {taskData.requests.map((task) => (
                  <div
                    key={task.task_id}
                    className="bg-white border border-amber-200 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full border border-amber-200">
                          {task.assigner_role === 'Faculty' ? 'Supervisor Request' : 'Member Request'}
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">
                          {task.formatted_deadline ? `Due: ${task.formatted_deadline}` : 'No deadline'}
                        </span>
                      </div>

                      <p className="text-sm font-bold text-black leading-relaxed whitespace-pre-line">
                        {task.task_description}
                      </p>

                      <p className="text-xs text-slate-700 font-semibold">
                        Assigned by: <span className="text-blue-950 font-bold">{task.assigner_name || 'Group Member'}</span>
                      </p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={actionTaskId === task.task_id}
                        onClick={() => handleTaskAction(task.task_id, 'accept')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        type="button"
                        disabled={actionTaskId === task.task_id}
                        onClick={() => handleTaskAction(task.task_id, 'reject')}
                        className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 2: In Progress Tasks */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-black uppercase tracking-wider">
                In Progress Tasks
              </h3>
            </div>

            {/* Sub-category: Assigned by Supervisor */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-950 bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200 inline-block">
                Assigned by Supervisor ({taskData.in_progress_supervisor.length})
              </h4>

              {taskData.in_progress_supervisor.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-xs font-medium text-slate-500">
                  No active tasks assigned by supervisor.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskData.in_progress_supervisor.map((task) => (
                    <div
                      key={task.task_id}
                      className="bg-white border border-purple-200 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                            Supervisor
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            {task.formatted_deadline ? `Due: ${task.formatted_deadline}` : 'No deadline'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-black leading-relaxed">
                          {task.task_description}
                        </p>
                        <p className="text-xs text-slate-700 font-semibold">
                          Assigned by: <span className="text-purple-950 font-bold">{task.assigner_name}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={actionTaskId === task.task_id}
                        onClick={() => handleTaskAction(task.task_id, 'complete')}
                        className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-category: Assigned by Members */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950 bg-sky-50 px-3 py-1.5 rounded-xl border border-sky-200 inline-block">
                Assigned by Members ({taskData.in_progress_members.length})
              </h4>

              {taskData.in_progress_members.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-xs font-medium text-slate-500">
                  No active tasks assigned by group members.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskData.in_progress_members.map((task) => (
                    <div
                      key={task.task_id}
                      className="bg-white border border-sky-200 rounded-3xl p-5 shadow-xs space-y-4 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-extrabold uppercase text-blue-900 bg-sky-100 px-2 py-0.5 rounded-md">
                            Group Member
                          </span>
                          <span className="text-[11px] font-bold text-slate-600">
                            {task.formatted_deadline ? `Due: ${task.formatted_deadline}` : 'No deadline'}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-black leading-relaxed">
                          {task.task_description}
                        </p>
                        <p className="text-xs text-slate-700 font-semibold">
                          Assigned by: <span className="text-blue-950 font-bold">{task.assigner_name || 'Member'}</span>
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={actionTaskId === task.task_id}
                        onClick={() => handleTaskAction(task.task_id, 'complete')}
                        className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                      >
                        Mark as Completed
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: Completed Tasks */}
          <div className="space-y-6">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="text-lg font-black text-black uppercase tracking-wider">
                Completed Tasks
              </h3>
            </div>

            {/* Sub-category: Assigned by Supervisor */}
            <div className="space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block">
                Assigned by Supervisor ({taskData.completed_supervisor.length})
              </h4>

              {taskData.completed_supervisor.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-xs font-medium text-slate-500">
                  No completed tasks assigned by supervisor.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskData.completed_supervisor.map((task) => (
                    <div
                      key={task.task_id}
                      className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <span>✓ Completed</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">
                          {task.formatted_deadline || 'No deadline'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-black leading-relaxed line-through opacity-85">
                        {task.task_description}
                      </p>
                      <p className="text-xs text-slate-700 font-semibold pt-2 border-t border-slate-100">
                        Assigned by: <span className="text-blue-950 font-bold">{task.assigner_name}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-category: Assigned by Members */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-teal-950 bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-200 inline-block">
                Assigned by Members ({taskData.completed_members.length})
              </h4>

              {taskData.completed_members.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-6 text-center text-xs font-medium text-slate-500">
                  No completed tasks assigned by members.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {taskData.completed_members.map((task) => (
                    <div
                      key={task.task_id}
                      className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center space-x-1">
                          <span>✓ Completed</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-600">
                          {task.formatted_deadline || 'No deadline'}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-black leading-relaxed">
                        {task.task_description}
                      </p>
                      <p className="text-xs text-slate-700 font-semibold pt-2 border-t border-slate-100">
                        Assigned by: <span className="text-blue-950 font-bold">{task.assigner_name || 'Member'}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-xl font-extrabold text-blue-950">Add New Thesis Task</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-black p-1 rounded-xl hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                  Assign To Group Member *
                </label>
                {taskData.group_members.length === 0 ? (
                  <p className="text-xs text-rose-700 font-semibold p-3 bg-rose-50 rounded-xl border border-rose-200">
                    You do not have other student members in your thesis group to assign tasks to.
                  </p>
                ) : (
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    required
                    className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-black text-xs sm:text-sm font-semibold focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                  >
                    {taskData.group_members.map((member) => (
                      <option key={member.student_id} value={member.student_id}>
                        {member.name} (#{member.student_id})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                  Task Description *
                </label>
                <textarea
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="Provide detailed instructions for the task..."
                  required
                  rows={4}
                  className="w-full bg-white border border-slate-300 rounded-2xl p-4 text-black text-xs sm:text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 placeholder:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
                  Deadline (Optional)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 text-black text-xs sm:text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || taskData.group_members.length === 0}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Assign Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
