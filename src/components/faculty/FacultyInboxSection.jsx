import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyInboxSection({ user }) {
  const [inboxData, setInboxData] = useState({ supervisor_requests: [], meeting_requests: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Modal / Form state for responding to supervisor request
  const [activeModalRequest, setActiveModalRequest] = useState(null) // selected request item
  const [selectedRole, setSelectedRole] = useState('supervisor')
  const [responseAction, setResponseAction] = useState('accept') // 'accept' or 'reject'
  const [responseText, setResponseText] = useState('')
  const [offerMeeting, setOfferMeeting] = useState(true)
  const [semester, setSemester] = useState('Summer 2026')
  const [processing, setProcessing] = useState(false)

  // Group Details Inspection Modal
  const [inspectGroupModal, setInspectGroupModal] = useState(null)

  const fetchInbox = () => {
    if (!user) return
    const userId = user.uid || user.UID || user.faculty_id
    if (!userId) return
    setLoading(true)
    fetch(`${API_BASE_URL}/api/faculty/inbox/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setInboxData({
            supervisor_requests: data.supervisor_requests || [],
            meeting_requests: data.meeting_requests || []
          })
        } else {
          setError(data.message || 'Failed to load inbox requests.')
        }
      })
      .catch(() => setError('Failed to connect to inbox server.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchInbox()
  }, [user?.uid])

  const openResponseModal = (reqItem, action) => {
    setActiveModalRequest(reqItem)
    setResponseAction(action)
    setSelectedRole(reqItem.role || 'supervisor')
    setSemester(reqItem.semester || 'Summer 2026')
    setResponseText('')
    setOfferMeeting(action === 'accept')
  }

  const handleRespondSupervisorRequest = async (e) => {
    e.preventDefault()
    if (!activeModalRequest) return
    setProcessing(true)
    setStatusMsg('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/faculty/inbox/supervisor-request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faculty_id: user.uid,
          group_id: activeModalRequest.group_id,
          role: selectedRole,
          action: responseAction,
          response_message: responseText.trim(),
          offer_meeting: offerMeeting,
          semester: semester,
          sender_id: activeModalRequest.sender_id,
          timestamp: activeModalRequest.timestamp
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setStatusMsg(data.message)
        setActiveModalRequest(null)
        fetchInbox()
      } else {
        setStatusMsg(data.message || 'Failed to process request.')
      }
    } catch {
      setStatusMsg('Failed to process request.')
    } finally {
      setProcessing(false)
    }
  }

  const handleRespondMeeting = async (meetingId, action) => {
    setProcessing(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/faculty/inbox/meeting-request/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          host_id: user.uid,
          action: action
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setStatusMsg(data.message)
        fetchInbox()
      } else {
        setStatusMsg(data.message || 'Failed to update meeting.')
      }
    } catch {
      setStatusMsg('Failed to update meeting status.')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  const pendingSupervisorReqs = inboxData.supervisor_requests.filter(
    (r) => !r.status || r.status.toLowerCase() === 'pending'
  )
  const pendingMeetingReqs = inboxData.meeting_requests.filter(
    (m) => !m.approve_stat || m.approve_stat.toLowerCase() === 'pending'
  )

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-950">Faculty Inbox & Requests</h2>
          <p className="text-slate-500 text-xs mt-1">
            Review supervision requests from thesis groups and incoming meeting requests
          </p>
        </div>

        <div className="flex gap-3 text-xs font-bold">
          <span className="px-3 py-1.5 bg-blue-100 text-blue-900 rounded-xl border border-blue-200">
            {pendingSupervisorReqs.length} Supervision Requests
          </span>
          <span className="px-3 py-1.5 bg-amber-100 text-amber-900 rounded-xl border border-amber-200">
            {pendingMeetingReqs.length} Meeting Requests
          </span>
        </div>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-semibold flex justify-between items-center">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg('')} className="text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: SUPERVISOR & CO-SUPERVISOR REQUESTS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Supervisor / Co-Supervisor Requests ({inboxData.supervisor_requests.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Students submit requests as a group. Inspect group details, member CGPA/credits, and respond.
          </p>
        </div>

        {inboxData.supervisor_requests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-100">
            No supervisor or co-supervisor requests in your inbox right now.
          </div>
        ) : (
          <div className="space-y-4">
            {inboxData.supervisor_requests.map((req, idx) => {
              const isPending = !req.status || req.status.toLowerCase() === 'pending'
              const gInfo = req.group_info

              return (
                <div
                  key={idx}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 transition-all hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-blue-900 text-white rounded-full text-xs font-bold">
                        Group #{req.group_id}
                      </span>
                      <span className="px-3 py-1 bg-sky-100 text-sky-950 rounded-full text-xs font-bold uppercase">
                        Requested: {req.role}
                      </span>
                      <span className="text-slate-400 text-xs font-mono">{req.formatted_time}</span>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : req.status === 'ACCEPTED'
                          ? 'bg-emerald-100 text-emerald-900'
                          : 'bg-rose-100 text-rose-900'
                      }`}
                    >
                      Status: {req.status || 'Pending'}
                    </span>
                  </div>

                  {/* Proposal Details */}
                  {gInfo && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                      <h4 className="font-extrabold text-slate-900 text-sm">{gInfo.title}</h4>
                      <p className="text-xs font-semibold text-blue-900">Domain: {gInfo.domain}</p>
                      <p className="text-xs text-slate-600 line-clamp-2">{gInfo.description}</p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setInspectGroupModal(gInfo)}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold text-xs rounded-xl transition-all"
                    >
                      Inspect Group Details & Members
                    </button>

                    {isPending && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openResponseModal(req, 'reject')}
                          className="px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-xl transition-all"
                        >
                          Reject Idea / Request
                        </button>
                        <button
                          type="button"
                          onClick={() => openResponseModal(req, 'accept')}
                          className="px-5 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                        >
                          Approve Request
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: MEETING REQUESTS */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-lg font-bold text-slate-900">
            Meeting Requests ({inboxData.meeting_requests.length})
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Meetings requested by your thesis groups. Accepting schedules the meeting; rejecting cancels it.
          </p>
        </div>

        {inboxData.meeting_requests.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-xs font-medium bg-slate-50 rounded-2xl border border-slate-100">
            No meeting requests received.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inboxData.meeting_requests.map((m) => {
              const isPending = !m.approve_stat || m.approve_stat.toLowerCase() === 'pending'
              const isApproved = m.approve_stat === 'Approved'

              return (
                <div
                  key={m.meeting_id}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-sky-100 text-sky-950 rounded-full text-xs font-bold">
                        Meeting #{m.meeting_id} • Group #{m.group_id}
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isApproved
                            ? 'bg-emerald-100 text-emerald-900'
                            : isPending
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-rose-100 text-rose-900'
                        }`}
                      >
                        {m.approve_stat || 'Pending'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-sm">{m.thesis_title}</h4>
                    <p className="text-xs font-bold text-blue-900">
                      📅 Date: {m.date} | ⏰ Slot: {m.slot}
                    </p>
                    <p className="text-xs text-slate-600">
                      📍 Room / Link: <span className="font-semibold text-slate-800">{m.link_or_room || 'TBD'}</span>
                    </p>
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-2 border-t border-slate-200">
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => handleRespondMeeting(m.meeting_id, 'reject')}
                        className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-xl transition-all"
                      >
                        Reject & Cancel
                      </button>
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => handleRespondMeeting(m.meeting_id, 'accept')}
                        className="flex-1 py-2 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl transition-all shadow-xs"
                      >
                        Accept & Schedule
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* MODAL 1: INSPECT GROUP MEMBERS & DETAILS */}
      {inspectGroupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="px-3 py-1 bg-blue-900 text-white font-extrabold rounded-full text-xs uppercase">
                  Thesis Group #{inspectGroupModal.group_id}
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-2">
                  {inspectGroupModal.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectGroupModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Domain</h4>
              <p className="text-xs font-bold text-blue-900">{inspectGroupModal.domain}</p>

              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mt-3 mb-1">Description</h4>
              <p className="text-xs text-slate-700 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
                {inspectGroupModal.description}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Group Members & Credentials
              </h4>
              <div className="space-y-3">
                {inspectGroupModal.members?.map((m) => (
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
                        {m.credits_per_sem} cr / sem
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectGroupModal(null)}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RESPOND TO SUPERVISOR REQUEST */}
      {activeModalRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleRespondSupervisorRequest}
            className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">
                  {responseAction === 'accept' ? 'Approve Supervision Request' : 'Decline Supervision Request'}
                </h3>
                <p className="text-xs text-slate-500">Thesis Group #{activeModalRequest.group_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalRequest(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Supervision Role</label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-900"
                >
                  <option value="supervisor">Primary Supervisor</option>
                  <option value="co-supervisor">Co-Supervisor</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Semester</label>
                <input
                  type="text"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  {responseAction === 'accept' ? 'Message / Feedback (Optional)' : 'Rejection Reason / Preferred Topic'}
                </label>
                <textarea
                  rows="3"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={
                    responseAction === 'accept'
                      ? 'Add any plain text comments or expectations...'
                      : 'Explain what topic or changes you prefer instead...'
                  }
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                ></textarea>
              </div>

              {responseAction === 'accept' && (
                <div className="bg-sky-50 border border-sky-200 p-4 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="font-bold text-sky-950 block">Offer Calendar Meeting Link</span>
                    <span className="text-[11px] text-sky-800">
                      Send your booking link to requesting group so they can schedule a meeting.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={offerMeeting}
                    onChange={(e) => setOfferMeeting(e.target.checked)}
                    className="w-5 h-5 rounded-md text-blue-900 focus:ring-blue-900 cursor-pointer"
                  />
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveModalRequest(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={processing}
                className={`px-6 py-2.5 font-bold text-xs rounded-xl text-white shadow-xs ${
                  responseAction === 'accept'
                    ? 'bg-blue-900 hover:bg-blue-950'
                    : 'bg-rose-900 hover:bg-rose-950'
                }`}
              >
                {processing ? 'Submitting...' : responseAction === 'accept' ? 'Confirm Approval' : 'Confirm Rejection'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
