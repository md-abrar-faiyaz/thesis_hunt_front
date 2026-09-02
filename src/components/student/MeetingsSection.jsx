import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

const PREDEFINED_SLOTS = [
  '08:00 AM - 09:30 AM',
  '09:30 AM - 11:00 AM',
  '11:00 AM - 12:30 PM',
  '12:30 PM - 02:00 PM',
  '02:00 PM - 03:30 PM',
  '03:30 PM - 05:00 PM',
  '05:00 PM - 06:30 PM'
]

const isWithinTwoWeeks = (dateStr) => {
  if (!dateStr) return false
  const parts = dateStr.split('-')
  if (parts.length !== 3) return false

  const year = parseInt(parts[0], 10)
  const month = parseInt(parts[1], 10) - 1
  const day = parseInt(parts[2], 10)

  const meetingDate = new Date(year, month, day, 0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const twoWeeksLimit = new Date(today)
  twoWeeksLimit.setDate(today.getDate() + 14)

  return meetingDate >= today && meetingDate <= twoWeeksLimit
}

export default function MeetingsSection({ user, isThesisDone: isThesisDoneProp }) {
  const isThesisDone = Boolean(
    isThesisDoneProp ||
    user?.has_done_thesis === true ||
    user?.has_done_thesis === 1 ||
    user?.has_done_thesis === 'true' ||
    user?.has_done_thesis === '1'
  )

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [hasGroup, setHasGroup] = useState(false)
  const [groupId, setGroupId] = useState(null)

  const [approvedMeetings, setApprovedMeetings] = useState([])
  const [pendingMeetings, setPendingMeetings] = useState([])
  const [rejectedMeetings, setRejectedMeetings] = useState([])
  const [incomingMeetings, setIncomingMeetings] = useState([])
  const [hosts, setHosts] = useState([])

  // Ask for Meeting Modal & Host Search State
  const [showModal, setShowModal] = useState(false)
  const [hostSearchQuery, setHostSearchQuery] = useState('')
  const [selectedHost, setSelectedHost] = useState(null)
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [meetingDate, setMeetingDate] = useState('')
  const [meetingSlot, setMeetingSlot] = useState(PREDEFINED_SLOTS[0])
  const [modalError, setModalError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Host Accept Modal State
  const [showAcceptModal, setShowAcceptModal] = useState(false)
  const [targetMeeting, setTargetMeeting] = useState(null)
  const [hostLinkOrRoom, setHostLinkOrRoom] = useState('')
  const [acceptError, setAcceptError] = useState('')
  const [responding, setResponding] = useState(false)

  const fetchMeetings = useCallback(async () => {
    if (!user || !user.uid) return
    try {
      setLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/student/meetings/${user.uid}`)
      const data = await res.json()

      if (data.status === 'ok') {
        setHasGroup(data.has_group)
        setGroupId(data.group_id || null)
        setApprovedMeetings(data.approved_meetings || [])
        setPendingMeetings(data.pending_meetings || [])
        setRejectedMeetings(data.rejected_meetings || [])
        setIncomingMeetings(data.incoming_meetings || [])
        setHosts(data.hosts || [])
      } else {
        setError(data.message || 'Failed to fetch meetings.')
      }
    } catch (err) {
      setError('Network error fetching meetings.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchMeetings()
  }, [fetchMeetings])

  const filteredHosts = hosts.filter((h) => {
    if (!hostSearchQuery.trim()) return true
    const q = hostSearchQuery.toLowerCase().trim()
    const nameMatch = h.name ? h.name.toLowerCase().includes(q) : false
    const emailMatch = h.email ? h.email.toLowerCase().includes(q) : false
    const initialMatch = h.initial ? h.initial.toLowerCase().includes(q) : false
    const studentIdMatch = h.student_id ? String(h.student_id).includes(q) : false
    const hostIdMatch = h.host_id ? String(h.host_id).includes(q) : false
    return nameMatch || emailMatch || initialMatch || studentIdMatch || hostIdMatch
  })

  const handleRequestMeeting = async (e) => {
    e.preventDefault()
    setModalError('')
    if (!selectedHost || !meetingDate || !meetingSlot) {
      setModalError('Please select a host, date, and time slot.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch(`${API_BASE_URL}/api/student/meeting/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.uid,
          group_id: groupId,
          host_id: selectedHost.host_id,
          date: meetingDate,
          slot: meetingSlot
        })
      })
      const data = await res.json()

      if (data.status === 'ok') {
        setShowModal(false)
        setSelectedHost(null)
        setHostSearchQuery('')
        setMeetingDate('')
        fetchMeetings()
      } else {
        setModalError(data.message || 'Failed to request meeting.')
      }
    } catch (err) {
      setModalError('Network error requesting meeting.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteMeeting = async (meetingId) => {
    if (!window.confirm('Remove this meeting record?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/meeting/${meetingId}?student_id=${user.uid}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.status === 'ok') {
        fetchMeetings()
      } else {
        alert(data.message || 'Failed to delete meeting.')
      }
    } catch (err) {
      alert('Network error deleting meeting.')
    }
  }

  const handleRespondMeeting = async (meetingId, action, linkRoomVal = null) => {
    try {
      setResponding(true)
      setAcceptError('')
      const res = await fetch(`${API_BASE_URL}/api/student/meeting/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meeting_id: meetingId,
          host_id: user.uid,
          action: action,
          link_or_room: linkRoomVal
        })
      })
      const data = await res.json()

      if (data.status === 'ok') {
        setShowAcceptModal(false)
        setTargetMeeting(null)
        setHostLinkOrRoom('')
        fetchMeetings()
      } else {
        setAcceptError(data.message || `Failed to ${action} meeting.`)
        if (action === 'reject') alert(data.message || 'Failed to reject meeting.')
      }
    } catch (err) {
      setAcceptError('Network error responding to meeting.')
      if (action === 'reject') alert('Network error rejecting meeting.')
    } finally {
      setResponding(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Thesis Meetings
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-black">Schedule & Meeting Requests</h2>
          <p className="text-xs text-slate-600 font-medium">
            View scheduled meetings, manage host requests, or submit new meeting requests.
          </p>
        </div>

        {(hasGroup || isThesisDone) && (
          <button
            type="button"
            onClick={() => {
              setModalError('')
              setSelectedHost(null)
              setHostSearchQuery('')
              setShowModal(true)
            }}
            className="px-6 py-3.5 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
          >
            <span>Ask for Meeting</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-bold">
          {error}
        </div>
      )}

      {(() => {
        const activeIncomingMeetings = incomingMeetings.filter((m) => {
          const stat = (m.approve_stat || '').toLowerCase()
          if (stat === 'approved') {
            return isWithinTwoWeeks(m.date_str)
          }
          return true
        })

        const activeApprovedMeetings = approvedMeetings.filter((m) => isWithinTwoWeeks(m.date_str))

        return (
          <>
            {/* 1. HOST SECTION: Incoming Requests (For Me) */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <span className="w-3 h-3 rounded-full bg-purple-600"></span>
                <h3 className="text-lg font-black text-black">Incoming Requests : Hosted by You</h3>
                <span className="text-xs font-extrabold text-purple-900 bg-purple-100 border border-purple-300 px-2.5 py-0.5 rounded-full">
                  {activeIncomingMeetings.length}
                </span>
              </div>

              {activeIncomingMeetings.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center text-xs text-slate-600 font-medium">
                  You have no incoming meeting requests.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeIncomingMeetings.map((m) => {
                    const stat = (m.approve_stat || '').toLowerCase()
                    const isPending = stat === 'pending'
                    const isApproved = stat === 'approved'

                    return (
                      <div
                        key={m.meeting_id}
                        className={`bg-white border rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden ${
                          isApproved
                            ? 'border-emerald-200'
                            : stat === 'rejected'
                            ? 'border-rose-200'
                            : 'border-purple-200'
                        }`}
                      >
                        <div
                          className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                            isApproved
                              ? 'bg-emerald-500'
                              : stat === 'rejected'
                              ? 'bg-rose-500'
                              : 'bg-purple-500'
                          }`}
                        ></div>

                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <span
                              className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                                isApproved
                                  ? 'text-emerald-900 bg-emerald-100'
                                  : stat === 'rejected'
                                  ? 'text-rose-900 bg-rose-100'
                                  : 'text-purple-900 bg-purple-100'
                              }`}
                            >
                              {m.approve_stat}
                            </span>
                            <h4 className="text-sm font-black text-black">{m.date_str}</h4>
                            <p className="text-xs font-bold text-slate-800">Time Slot: {m.slot}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-700">
                          <p className="font-semibold">
                            <span className="text-slate-600 font-medium">Requested Group: </span>
                            <span className="font-extrabold text-black">{m.group_title || `Group #${m.group_id}`}</span>
                          </p>
                          {m.group_domain && (
                            <p className="text-[11px] text-slate-500 font-medium">
                              Domain: {m.group_domain}
                            </p>
                          )}
                          <p className="font-semibold truncate">
                            <span className="text-slate-600 font-medium">Venue: </span>
                            {m.link_or_room ? (
                              <span className="font-bold text-black">{m.link_or_room}</span>
                            ) : (
                              <span className="text-slate-600 italic">Not set yet</span>
                            )}
                          </p>
                        </div>

                        {/* Accept / Reject Buttons for Pending Incoming Requests */}
                        {isPending && (
                          <div className="flex items-center space-x-2 pt-2 border-t border-slate-100">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetMeeting(m)
                                setHostLinkOrRoom('')
                                setAcceptError('')
                                setShowAcceptModal(true)
                              }}
                              className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                            >
                              ✓ Accept
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm('Reject this meeting request?')) {
                                  handleRespondMeeting(m.meeting_id, 'reject')
                                }
                              }}
                              className="flex-1 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl text-xs font-bold transition-all"
                            >
                              ✕ Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {!hasGroup && !isThesisDone ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center max-w-xl mx-auto shadow-sm space-y-4 my-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-900 rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold">
                  📅
                </div>
                <h3 className="text-xl font-extrabold text-black">No Thesis Group Joined</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  You are currently not part of any thesis group. Join or create a thesis group to request meetings with supervisors and members!
                </p>
              </div>
            ) : (
              /* 3 Group Meeting Categories */
              <div className="space-y-8 pt-4 border-t border-slate-200">
                {/* 1. Approved Meetings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                    <div>
                      <h3 className="text-lg font-black text-black">Group Approved Meetings</h3>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      {activeApprovedMeetings.length}
                    </span>
                  </div>

                  {activeApprovedMeetings.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center text-xs text-slate-600 font-medium">
                      No approved meetings scheduled within the next 2 weeks.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeApprovedMeetings.map((m) => (
                        <div
                          key={m.meeting_id}
                          className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-emerald-500"></div>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-md">
                                Approved ✓
                              </span>
                              <h4 className="text-sm font-black text-black">{m.date_str}</h4>
                              <p className="text-xs font-bold text-slate-800">Time Slot: {m.slot}</p>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-700">
                            <p className="font-semibold">
                              <span className="text-slate-600 font-medium">Host: </span>
                              <span className="font-extrabold text-black">{m.host_name}</span> ({m.host_role})
                            </p>
                            <p className="font-semibold truncate">
                              <span className="text-slate-600 font-medium">Venue: </span>
                              {m.link_or_room ? (
                                m.link_or_room.startsWith('http') ? (
                                  <a
                                    href={m.link_or_room}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-blue-900 underline font-bold"
                                  >
                                    {m.link_or_room}
                                  </a>
                                ) : (
                                  <span className="font-bold text-black">{m.link_or_room}</span>
                                )
                              ) : (
                                <span className="text-slate-600 italic">To be provided by host</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. Pending Meetings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                    <h3 className="text-lg font-black text-black">Group Pending Meetings</h3>
                    <span className="text-xs font-extrabold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full">
                      {pendingMeetings.length}
                    </span>
                  </div>

                  {pendingMeetings.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center text-xs text-slate-600 font-medium">
                      No pending meeting requests.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {pendingMeetings.map((m) => (
                        <div
                          key={m.meeting_id}
                          className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500"></div>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                                Pending ⏳
                              </span>
                              <h4 className="text-sm font-black text-black">{m.date_str}</h4>
                              <p className="text-xs font-bold text-slate-800">Time Slot: {m.slot}</p>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteMeeting(m.meeting_id)}
                              className="p-1.5 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-all"
                              title="Cancel Request"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-700">
                            <p className="font-semibold">
                              <span className="text-slate-600 font-medium">Host: </span>
                              <span className="font-extrabold text-black">{m.host_name}</span> ({m.host_role})
                            </p>
                            <p className="font-semibold truncate">
                              <span className="text-slate-600 font-medium">Location / Link: </span>
                              {m.link_or_room ? (
                                <span className="font-bold text-black">{m.link_or_room}</span>
                              ) : (
                                <span className="text-slate-600 italic">To be provided by host</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. Rejected Meetings */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                    <h3 className="text-lg font-black text-black">Group Rejected Meetings</h3>
                    <span className="text-xs font-extrabold text-rose-800 bg-rose-100 border border-rose-300 px-2.5 py-0.5 rounded-full">
                      {rejectedMeetings.length}
                    </span>
                  </div>

                  {rejectedMeetings.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 text-center text-xs text-slate-600 font-medium">
                      No rejected meetings.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rejectedMeetings.map((m) => (
                        <div
                          key={m.meeting_id}
                          className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs space-y-3 relative overflow-hidden"
                        >
                          <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500"></div>
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-900 bg-rose-100 px-2 py-0.5 rounded-md">
                                Rejected ✕
                              </span>
                              <h4 className="text-sm font-black text-black">{m.date_str}</h4>
                              <p className="text-xs font-bold text-slate-800">Time Slot: {m.slot}</p>
                            </div>

                            {/* Cross Button to Remove Rejected Meeting */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMeeting(m.meeting_id)}
                              className="p-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-lg transition-all font-bold"
                              title="Remove Rejected Meeting"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          <div className="pt-2 border-t border-slate-100 text-xs space-y-1 text-slate-700">
                            <p className="font-semibold">
                              <span className="text-slate-600 font-medium">Host: </span>
                              <span className="font-extrabold text-black">{m.host_name}</span> ({m.host_role})
                            </p>
                            <p className="font-semibold truncate">
                              <span className="text-slate-600 font-medium">Venue: </span>
                              {m.link_or_room ? (
                                <span className="font-bold text-black">{m.link_or_room}</span>
                              ) : (
                                <span className="text-slate-600 italic">To be provided by host</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )
      })()}

      {/* Ask for Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-black">Ask for Meeting</h3>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-600 hover:text-black cursor-pointer font-bold p-1"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-xs font-bold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleRequestMeeting} className="space-y-4">
              {/* Host Search Section */}
              <div className="relative space-y-1">
                <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-1">
                  Search Host
                </label>

                {selectedHost ? (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-3 rounded-xl">
                    <div className="text-xs">
                      <span className="font-black text-black">{selectedHost.name}</span>{' '}
                      <span className="text-blue-900 font-bold">({selectedHost.role})</span>
                      {selectedHost.initial && (
                        <span className="ml-1 bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded font-extrabold text-[10px]">
                          {selectedHost.initial}
                        </span>
                      )}
                      {selectedHost.student_id && (
                        <span className="ml-1 text-slate-600 font-medium text-[11px]">
                          ID: {selectedHost.student_id}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedHost(null)
                        setHostSearchQuery('')
                      }}
                      className="text-slate-500 hover:text-rose-700 font-bold px-2 text-xs"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input
                      type="text"
                      value={hostSearchQuery}
                      onChange={(e) => setHostSearchQuery(e.target.value)}
                      onFocus={() => setIsSearchFocused(true)}
                      placeholder="Type name, student ID, or faculty initial"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-blue-900"
                    />

                    {/* Search Autocomplete Suggestions */}
                    {isSearchFocused && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-48 overflow-y-auto z-20 divide-y divide-slate-100">
                        {filteredHosts.length === 0 ? (
                          <div className="p-3 text-xs text-slate-600 text-center font-medium">
                            No matching host found.
                          </div>
                        ) : (
                          filteredHosts.map((h) => (
                            <button
                              key={h.host_id}
                              type="button"
                              onClick={() => {
                                setSelectedHost(h)
                                setIsSearchFocused(false)
                              }}
                              className="w-full text-left p-2.5 hover:bg-sky-50 transition-colors flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-extrabold text-black">{h.name}</span>
                                {h.role === 'Student' && h.student_id && (
                                  <span className="ml-2 text-slate-600 text-[11px]">
                                    (ID: {h.student_id})
                                  </span>
                                )}
                                {h.role === 'Faculty' && h.initial && (
                                  <span className="ml-2 bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.2 rounded font-extrabold text-[10px]">
                                    Initial: {h.initial}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                {h.role}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-blue-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-1">
                    Select Time Slot
                  </label>
                  <select
                    value={meetingSlot}
                    onChange={(e) => setMeetingSlot(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-blue-900"
                  >
                    {PREDEFINED_SLOTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 font-medium">
                <strong>Note:</strong> Room number or meeting link will be provided by the host upon accepting the meeting request.
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedHost}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Meeting Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Host Accept & Set Room/Link Modal */}
      {showAcceptModal && targetMeeting && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-black">Accept Meeting Request</h3>
                <p className="text-[11px] text-slate-600">Provide room number or meeting link to confirm meeting.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAcceptModal(false)}
                className="text-slate-600 hover:text-black font-bold p-1"
              >
                ✕
              </button>
            </div>

            {acceptError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-xs font-bold">
                {acceptError}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                if (!hostLinkOrRoom.trim()) {
                  setAcceptError('Please enter a room number or meeting link.')
                  return
                }
                handleRespondMeeting(targetMeeting.meeting_id, 'accept', hostLinkOrRoom)
              }}
              className="space-y-4"
            >
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-1">
                <p>
                  <span className="text-slate-600 font-medium">Group: </span>
                  <span className="font-extrabold text-black">{targetMeeting.group_title || `Group #${targetMeeting.group_id}`}</span>
                </p>
                <p>
                  <span className="text-slate-600 font-medium">Date & Slot: </span>
                  <span className="font-bold text-black">{targetMeeting.date_str} ({targetMeeting.slot})</span>
                </p>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-1">
                  Location / Room No. or Meeting Link *
                </label>
                <input
                  type="text"
                  value={hostLinkOrRoom}
                  onChange={(e) => setHostLinkOrRoom(e.target.value)}
                  placeholder="e.g. UB40501 or https://meet.google.com/..."
                  required
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAcceptModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={responding}
                  className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                >
                  {responding ? 'Confirming...' : 'Approve & Send Location'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
