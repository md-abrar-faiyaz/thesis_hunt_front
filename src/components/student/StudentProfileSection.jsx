import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function StudentProfileSection({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editCgpa, setEditCgpa] = useState('')
  const [editCredits, setEditCredits] = useState('')
  const [editSemNo, setEditSemNo] = useState('')
  const [domainsList, setDomainsList] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [formMsg, setFormMsg] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchProfile = useCallback(() => {
    if (!user || !user.uid) return

    setLoading(true)
    fetch(`${API_BASE_URL}/api/student/profile/${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.student) {
          setProfile(data.student)
        } else {
          setError(data.message || 'Failed to load student profile.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to backend server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user])

  const fetchDomains = () => {
    fetch(`${API_BASE_URL}/api/domains`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.domains && data.domains.length > 0) {
          const names = data.domains.map((d) => d.domain_name)
          setDomainsList(names)
        } else {
          setDomainsList([
            'Artificial Intelligence & Machine Learning',
            'Data Science & Big Data',
            'Software Engineering',
            'Cybersecurity & Cryptography'
          ])
        }
      })
      .catch(() => {
        setDomainsList(['Artificial Intelligence & Machine Learning', 'Software Engineering'])
      })
  }

  useEffect(() => {
    fetchProfile()
    fetchDomains()
  }, [fetchProfile])

  const handleOpenEditModal = () => {
    if (profile) {
      setEditCgpa(profile.CGPA !== null && profile.CGPA !== undefined ? profile.CGPA.toString() : '0.00')
      setEditCredits(profile.credits_completed !== null ? profile.credits_completed.toString() : '0')
      setEditSemNo(profile.sem_no !== null ? profile.sem_no.toString() : '1')
      const pref = profile.preferred_domain || ''
      if (domainsList.includes(pref)) {
        setSelectedDomain(pref)
        setCustomDomain('')
      } else if (pref) {
        setSelectedDomain('__CUSTOM__')
        setCustomDomain(pref)
      } else if (domainsList.length > 0) {
        setSelectedDomain(domainsList[0])
        setCustomDomain('')
      }
    }
    setFormMsg({ type: '', text: '' })
    setShowEditModal(true)
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setFormMsg({ type: '', text: '' })

    const cgpaVal = parseFloat(editCgpa)
    const creditsVal = parseInt(editCredits, 10)
    const semVal = parseInt(editSemNo, 10)

    if (isNaN(cgpaVal) || cgpaVal < 0 || cgpaVal > 4.0) {
      setFormMsg({ type: 'error', text: 'CGPA must be a valid number between 0.00 and 4.00.' })
      return
    }
    if (isNaN(creditsVal) || creditsVal < 0) {
      setFormMsg({ type: 'error', text: 'Completed credits must be a non-negative number.' })
      return
    }
    if (isNaN(semVal) || semVal < 1) {
      setFormMsg({ type: 'error', text: 'Current semester must be at least 1.' })
      return
    }

    const finalDomain = selectedDomain === '__CUSTOM__' ? customDomain : selectedDomain

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/profile/${user.uid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cgpa: cgpaVal,
          credits_completed: creditsVal,
          sem_no: semVal,
          domain_name: finalDomain
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        setFormMsg({ type: 'success', text: 'Profile updated successfully!' })
        setTimeout(() => {
          setShowEditModal(false)
          setFormMsg({ type: '', text: '' })
          fetchProfile()
        }, 1000)
      } else {
        setFormMsg({ type: 'error', text: data.message || 'Failed to update profile.' })
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: 'Network error: Failed to connect to server.' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl text-sm font-semibold">
        {error}
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* Student Profile Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Student Profile
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">{profile.name}</h2>
          <p className="text-sm text-black mt-1 font-medium">{profile.email}</p>
        </div>

        <div className="flex flex-col items-start sm:items-end gap-2">
          <div className="bg-sky-50 px-5 py-2.5 rounded-2xl border border-sky-200 text-left sm:text-right w-full sm:w-auto">
            <p className="text-[11px] text-black font-bold uppercase tracking-wider">Student ID</p>
            <p className="text-lg font-extrabold text-blue-950">#{profile.student_id}</p>
          </div>

          <button
            type="button"
            onClick={handleOpenEditModal}
            className="w-full sm:w-auto px-4 py-2 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span>Edit Profile</span>
          </button>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-black border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Personal Details</span>
            <span className="text-xs font-semibold text-blue-900 bg-sky-100 px-2 py-0.5 rounded-full border border-sky-200">Verified</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-black font-bold uppercase tracking-wider">Full Name</p>
              <p className="text-black font-semibold mt-1">{profile.name}</p>
            </div>

            <div>
              <p className="text-xs text-black font-bold uppercase tracking-wider">Student ID</p>
              <p className="text-black font-semibold mt-1">#{profile.student_id}</p>
            </div>

            <div>
              <p className="text-xs text-black font-bold uppercase tracking-wider">Email Address</p>
              <p className="text-black font-semibold mt-1 truncate">{profile.email}</p>
            </div>

            <div>
              <p className="text-xs text-black font-bold uppercase tracking-wider">Gender</p>
              <p className="text-black font-semibold mt-1">{profile.gender || 'Not Specified'}</p>
            </div>
          </div>
        </div>

        {/* Research Interest Card */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-black border-b border-slate-100 pb-3">
            Research Domain
          </h3>

          <div>
            <p className="text-xs text-black font-bold uppercase tracking-wider">Preferred Domain</p>
            <div className="mt-2 p-4 bg-sky-50 rounded-2xl border border-sky-200">
              <p className="text-blue-950 font-bold text-base">
                {profile.preferred_domain || 'No preferred domain set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Progress & Derived Metrics */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm">
        <h3 className="text-base font-bold text-black border-b border-slate-100 pb-4 mb-6">
          Academic Progress & Performance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CGPA */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-black uppercase tracking-wider">CGPA</p>
            <p className="text-3xl font-extrabold text-blue-950 mt-2">
              {profile.CGPA !== null && profile.CGPA !== undefined ? profile.CGPA.toFixed(2) : 'N/A'}
            </p>
            <p className="text-[11px] text-slate-700 mt-1 font-medium">Scale of 4.00</p>
          </div>

          {/* Credits Completed */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-black uppercase tracking-wider">Completed Credits</p>
            <p className="text-3xl font-extrabold text-blue-900 mt-2">
              {profile.credits_completed}
            </p>
            <p className="text-[11px] text-slate-700 mt-1 font-medium">Total credits earned</p>
          </div>

          {/* Current Semester */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <p className="text-xs font-bold text-black uppercase tracking-wider">Current Semester</p>
            <p className="text-3xl font-extrabold text-black mt-2">
              {profile.sem_no}
            </p>
            <p className="text-[11px] text-slate-700 mt-1 font-medium">Completed Semesters {profile.sem_no - 1}</p>
          </div>

          {/* Derived Metric */}
          <div className="bg-sky-50 p-5 rounded-2xl border border-sky-200 shadow-xs">
            <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Credits / Semester</p>
            <p className="text-3xl font-extrabold text-blue-950 mt-2">
              {profile.credits_completed_per_semester}
            </p>
            <p className="text-[11px] text-blue-900/80 mt-1 font-medium">Calculated Average</p>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal Popup */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-blue-950">Edit Academic Profile</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Update your CGPA, completed credits, current semester, and preferred research domain.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-black font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {formMsg.text && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* CGPA */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.0"
                    value={editCgpa}
                    onChange={(e) => setEditCgpa(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-semibold"
                  />
                </div>

                {/* Completed Credits */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                    Credits
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editCredits}
                    onChange={(e) => setEditCredits(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-semibold"
                  />
                </div>

                {/* Current Semester */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                    Semester
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={editSemNo}
                    onChange={(e) => setEditSemNo(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all font-semibold"
                  />
                </div>
              </div>

              {/* Preferred Domain */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  Preferred Research Domain
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all mb-2"
                >
                  {domainsList.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                  <option value="__CUSTOM__">Add / Type New Custom Domain</option>
                </select>

                {selectedDomain === '__CUSTOM__' && (
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="Enter custom research domain"
                    required
                    className="w-full px-4 py-2.5 bg-sky-50 border border-sky-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                )}
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


