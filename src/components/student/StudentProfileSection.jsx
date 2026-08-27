import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function StudentProfileSection({ user }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
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

        <div className="flex items-center space-x-3 bg-sky-50 px-5 py-3 rounded-2xl border border-sky-200">
          <div className="text-right">
            <p className="text-xs text-black font-bold uppercase">Student ID</p>
            <p className="text-lg font-extrabold text-blue-950">#{profile.student_id}</p>
          </div>
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
    </div>
  )
}

