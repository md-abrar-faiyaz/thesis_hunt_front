import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyProfileSection({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saveStatus, setSaveStatus] = useState('')

  // Form State
  const [designation, setDesignation] = useState('')
  const [ugPg, setUgPg] = useState('Undergraduate')
  const [semFreeFrom, setSemFreeFrom] = useState('')
  const [maxGrpPerSem, setMaxGrpPerSem] = useState(3)
  const [roomNo, setRoomNo] = useState('')
  const [calendarLink, setCalendarLink] = useState('')
  const [domainName, setDomainName] = useState('')

  const fetchProfile = () => {
    if (!user || !user.uid) return
    setLoading(true)
    fetch(`${API_BASE_URL}/api/faculty/profile/${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.faculty) {
          setProfile(data.faculty)
          setDesignation(data.faculty.designation || '')
          setUgPg(data.faculty.ug_pg || 'Undergraduate')
          setSemFreeFrom(data.faculty.sem_free_from || '')
          setMaxGrpPerSem(data.faculty.max_grp_per_sem || 3)
          setRoomNo(data.faculty.room_no || '')
          setCalendarLink(data.faculty.calendar_link || '')
          setDomainName(data.faculty.research_domain || '')
        } else {
          setError(data.message || 'Failed to load faculty profile.')
        }
      })
      .catch(() => setError('Could not connect to database server.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchProfile()
  }, [user?.uid])

  const handleUpdate = async (e) => {
    e.preventDefault()
    setSaveStatus('Saving changes...')
    try {
      const res = await fetch(`${API_BASE_URL}/api/faculty/profile/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          designation,
          ug_pg: ugPg,
          sem_free_from: semFreeFrom,
          max_grp_per_sem: parseInt(maxGrpPerSem) || 3,
          room_no: roomNo,
          calendar_link: calendarLink,
          domain_name: domainName
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setSaveStatus('Profile updated successfully!')
        setEditing(false)
        fetchProfile()
      } else {
        setSaveStatus(data.message || 'Failed to update profile.')
      }
    } catch {
      setSaveStatus('Failed to update profile.')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-2xl max-w-2xl mx-auto text-center font-medium">
        {error}
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Faculty Profile Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Faculty Profile
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">{profile.name}</h2>
          <p className="text-sm text-black mt-1 font-medium">
            {profile.designation || 'Faculty Member'} • Initial: <span className="font-bold text-blue-950">{profile.fac_initial}</span>
          </p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="bg-sky-50 px-5 py-2.5 rounded-2xl border border-sky-200 text-left sm:text-right w-full sm:w-auto">
            <p className="text-[11px] text-black font-bold uppercase tracking-wider">Faculty ID</p>
            <p className="text-lg font-extrabold text-blue-950">#{profile.faculty_id}</p>
          </div>

          <button
            type="button"
            onClick={() => setEditing(!editing)}
            className="w-full sm:w-auto px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>{editing ? 'Cancel Editing' : 'Edit Information'}</span>
          </button>
        </div>
      </div>

      {/* Profile Details Grid */}
      <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-900">Faculty Information & Setup</h3>
        </div>

        {saveStatus && (
          <div className="mb-6 p-4 rounded-xl text-xs font-semibold bg-sky-50 text-sky-900 border border-sky-200">
            {saveStatus}
          </div>
        )}

        {editing ? (
          <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Designation / Rank</label>
              <input
                type="text"
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">UG / PG Preference</label>
              <select
                value={ugPg}
                onChange={(e) => setUgPg(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
              >
                <option value="Undergraduate">Undergraduate (UG)</option>
                <option value="Postgraduate">Postgraduate (PG)</option>
                <option value="Both">Both (UG & PG)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester Free From</label>
              <input
                type="text"
                value={semFreeFrom}
                onChange={(e) => setSemFreeFrom(e.target.value)}
                placeholder="e.g. Summer 2026"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Max Groups Per Semester</label>
              <input
                type="number"
                min="1"
                max="20"
                value={maxGrpPerSem}
                onChange={(e) => setMaxGrpPerSem(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Room No.</label>
              <input
                type="text"
                value={roomNo}
                onChange={(e) => setRoomNo(e.target.value)}
                placeholder="e.g. SAC 902"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Calendar Booking Link</label>
              <input
                type="url"
                value={calendarLink}
                onChange={(e) => setCalendarLink(e.target.value)}
                placeholder="https://calendly.com/your-name"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Research Domain</label>
              <input
                type="text"
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-3 mt-3">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Faculty ID</span>
              <span className="text-base font-bold text-slate-900">#{profile.faculty_id}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</span>
              <span className="text-sm font-semibold text-slate-900 truncate block">{profile.email}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Faculty Initial</span>
              <span className="text-base font-bold text-blue-900">{profile.fac_initial}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Designation</span>
              <span className="text-sm font-semibold text-slate-900">{profile.designation || 'N/A'}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">UG / PG Category</span>
              <span className="text-sm font-semibold text-slate-900">{profile.ug_pg || 'Undergraduate'}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Semester Free From</span>
              <span className="text-sm font-bold text-emerald-700">{profile.sem_free_from || 'Available'}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Max Groups Per Sem</span>
              <span className="text-base font-bold text-slate-900">{profile.max_grp_per_sem || 3}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Supervised</span>
              <span className="text-base font-bold text-indigo-900">{profile.total_supervised || 0} groups</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Room No.</span>
              <span className="text-sm font-semibold text-slate-900">{profile.room_no || 'Not set'}</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 md:col-span-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Calendar Booking Link</span>
              {profile.calendar_link ? (
                <a
                  href={profile.calendar_link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-semibold text-blue-900 hover:underline truncate block"
                >
                  {profile.calendar_link}
                </a>
              ) : (
                <span className="text-xs text-slate-400">No link set yet</span>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Research Domain</span>
              <span className="text-sm font-semibold text-slate-900">{profile.research_domain || 'General'}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
