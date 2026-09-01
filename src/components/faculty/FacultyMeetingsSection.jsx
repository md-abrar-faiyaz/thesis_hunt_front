import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyMeetingsSection({ user }) {
  const [meetings, setMeetings] = useState([])
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showBookModal, setShowBookModal] = useState(false)
  const [statusMsg, setStatusMsg] = useState('')

  // Host Profile Popup Modal
  const [hostProfileModal, setHostProfileModal] = useState(null)

  // Booking Form State
  const [targetGroupId, setTargetGroupId] = useState('')
  const [date, setDate] = useState('')
  const [slot, setSlot] = useState('10:00 AM - 10:30 AM')
  const [linkOrRoom, setLinkOrRoom] = useState('')
  const [booking, setBooking] = useState(false)

  const fetchMeetingsData = () => {
    if (!user) return
    const userId = user.uid || user.UID || user.faculty_id
    if (!userId) return
    setLoading(true)

    // Fetch faculty meetings
    fetch(`${API_BASE_URL}/api/faculty/meetings/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setMeetings(data.meetings || [])
        } else {
          setError(data.message || 'Failed to fetch meetings.')
        }
      })
      .catch(() => setError('Failed to connect to meetings server.'))
      .finally(() => setLoading(false))

    // Fetch faculty supervised groups for booking selection dropdown
    fetch(`${API_BASE_URL}/api/faculty/groups/${userId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.groups) {
          setGroups(data.groups)
          if (data.groups.length > 0 && !targetGroupId) {
            setTargetGroupId(data.groups[0].group_id)
          }
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    fetchMeetingsData()
  }, [user?.uid])

  const handleBookMeeting = async (e) => {
    e.preventDefault()
    if (!targetGroupId || !date || !slot) return
    setBooking(true)
    setStatusMsg('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/faculty/meetings/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          faculty_id: user.uid,
          group_id: parseInt(targetGroupId),
          date: date,
          slot: slot,
          link_or_room: linkOrRoom.trim() || 'Online / Faculty Room'
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setStatusMsg('Meeting booked and scheduled successfully!')
        setShowBookModal(false)
        fetchMeetingsData()
      } else {
        setStatusMsg(data.message || 'Failed to book meeting.')
      }
    } catch {
      setStatusMsg('Failed to book meeting.')
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Booking Action Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-950">Meetings Dashboard</h2>
          <p className="text-slate-500 text-xs mt-1">
            View scheduled, pending, and host meeting sessions for your thesis groups
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowBookModal(true)}
          className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
        >
          + Book Meeting With Group
        </button>
      </div>

      {statusMsg && (
        <div className="bg-sky-50 border border-sky-200 text-sky-900 p-4 rounded-2xl text-xs font-semibold flex justify-between items-center">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg('')} className="text-sky-900 font-bold">
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
      ) : meetings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs font-medium">
          No meetings scheduled yet. Click "+ Book Meeting With Group" above to schedule a session.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {meetings.map((m) => {
            const isApproved = m.approve_stat === 'Approved'
            const isPending = !m.approve_stat || m.approve_stat.toLowerCase() === 'pending'

            return (
              <div
                key={m.meeting_id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="px-3 py-1 bg-sky-100 text-sky-950 font-bold rounded-full text-xs">
                      Meeting #{m.meeting_id} • Group #{m.group_id}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                          : isPending
                          ? 'bg-amber-100 text-amber-900 border border-amber-300'
                          : 'bg-rose-100 text-rose-900 border border-rose-300'
                      }`}
                    >
                      {m.approve_stat || 'Pending'}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">{m.thesis_title}</h3>
                    <p className="text-xs font-semibold text-blue-900 mt-0.5">Domain: {m.domain}</p>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Date:</span>
                      <span className="font-extrabold text-slate-900">{m.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Slot:</span>
                      <span className="font-bold text-blue-900">{m.slot}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-bold">Room / Link:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                        {m.link_or_room || 'TBD'}
                      </span>
                    </div>
                  </div>

                  {/* Embedded Host Profile Link */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-bold">Host / Approver:</span>
                    <button
                      type="button"
                      onClick={() => setHostProfileModal(m)}
                      className="text-blue-900 hover:text-blue-950 font-bold underline flex items-center gap-1"
                    >
                      <span>{m.host_name}</span>
                      <span className="text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.5 rounded-md no-underline">
                        ({m.host_role})
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* HOST PROFILE MODAL */}
      {hostProfileModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Host Profile Details</h3>
              <button
                type="button"
                onClick={() => setHostProfileModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Name</span>
                <span className="font-extrabold text-slate-900 text-sm">{hostProfileModal.host_name}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Email</span>
                <span className="font-semibold text-slate-900 text-xs">{hostProfileModal.host_email}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-slate-400 font-bold uppercase text-[10px] block">Role & ID</span>
                <span className="font-semibold text-slate-900 text-xs">
                  {hostProfileModal.host_role} • User ID #{hostProfileModal.host_id}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setHostProfileModal(null)}
                className="px-5 py-2 bg-blue-900 text-white font-bold text-xs rounded-xl shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOOK MEETING MODAL */}
      {showBookModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleBookMeeting}
            className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Book Meeting With Thesis Group</h3>
                <p className="text-xs text-slate-500">Schedule a meeting session with your supervised students</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Target Thesis Group</label>
                {groups.length === 0 ? (
                  <p className="text-rose-600">No supervised groups found.</p>
                ) : (
                  <select
                    value={targetGroupId}
                    onChange={(e) => setTargetGroupId(e.target.value)}
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
                <label className="block font-bold text-slate-700 uppercase mb-1">Meeting Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Time Slot</label>
                <select
                  value={slot}
                  onChange={(e) => setSlot(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-none focus:border-blue-900"
                >
                  <option value="09:00 AM - 09:30 AM">09:00 AM - 09:30 AM</option>
                  <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
                  <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
                  <option value="02:00 PM - 02:30 PM">02:00 PM - 02:30 PM</option>
                  <option value="03:30 PM - 04:00 PM">03:30 PM - 04:00 PM</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Room No. / Online Link</label>
                <input
                  type="text"
                  value={linkOrRoom}
                  onChange={(e) => setLinkOrRoom(e.target.value)}
                  placeholder="e.g. SAC 902 or Google Meet URL"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBookModal(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={booking || groups.length === 0}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                {booking ? 'Scheduling...' : 'Confirm Schedule'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
