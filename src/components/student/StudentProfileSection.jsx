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
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-rose-950/80 border border-rose-500/50 text-rose-300 p-5 rounded-2xl text-sm font-semibold">
        {error}
      </div>
    )
  }

  if (!profile) return null

  return (
    <div className="max-w-5xl space-y-6">
      {/* Student Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Student Profile
          </span>
          <h2 className="text-3xl font-bold text-white mt-2">{profile.name}</h2>
          <p className="text-sm text-slate-400 mt-1">{profile.email}</p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Student ID</p>
            <p className="text-lg font-extrabold text-cyan-400">#{profile.student_id}</p>
          </div>
        </div>
      </div>

      {/* Attributes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Card */}
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center justify-between">
            <span>Personal Details</span>
            <span className="text-xs font-normal text-slate-400">Verified User</span>
          </h3>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Full Name</p>
              <p className="text-slate-100 font-semibold mt-1">{profile.name}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Student ID</p>
              <p className="text-slate-100 font-semibold mt-1">#{profile.student_id}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Email Address</p>
              <p className="text-slate-100 font-semibold mt-1 truncate">{profile.email}</p>
            </div>

            <div>
              <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Gender</p>
              <p className="text-slate-100 font-semibold mt-1">{profile.gender || 'Not Specified'}</p>
            </div>
          </div>
        </div>

        {/* Research Interest Card */}
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-lg space-y-4">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3">
            Research Domain
          </h3>

          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Preferred Domain</p>
            <div className="mt-2 p-4 bg-slate-950 rounded-2xl border border-slate-800">
              <p className="text-cyan-400 font-bold text-base">
                {profile.preferred_domain || 'No preferred domain set'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Academic Progress & Derived Metrics */}
      <div className="bg-slate-900/90 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-lg">
        <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-4 mb-6">
          Academic Progress & Performance
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CGPA */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">CGPA</p>
            <p className="text-3xl font-extrabold text-cyan-400 mt-2">
              {profile.CGPA !== null && profile.CGPA !== undefined ? profile.CGPA.toFixed(2) : 'N/A'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Scale of 4.00</p>
          </div>

          {/* Credits Completed */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Credits</p>
            <p className="text-3xl font-extrabold text-blue-400 mt-2">
              {profile.credits_completed}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Total credits earned</p>
          </div>

          {/* Current Semester */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800/80">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Semester</p>
            <p className="text-3xl font-extrabold text-emerald-400 mt-2">
              {profile.sem_no}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Completed Semesters {profile.sem_no - 1}</p>
          </div>

          {/* Derived Metric */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/10">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Credits / Semester</p>
            <p className="text-3xl font-extrabold text-cyan-300 mt-2">
              {profile.credits_completed_per_semester}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">Calculated Average</p>
          </div>
        </div>
      </div>
    </div>
  )
}
