import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'
import StudentRegisterForm from './forms/StudentRegisterForm'
import FacultyRegisterForm from './forms/FacultyRegisterForm'

export default function LoginInterface() {
  const [authMode, setAuthMode] = useState('signin') // 'signin' or 'register'
  const [registerRole, setRegisterRole] = useState('student') // 'student' or 'faculty'
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  // Common User Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('Male')

  // Live Domains State
  const [domainsList, setDomainsList] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')

  // Student Fields
  const [cgpa, setCgpa] = useState('')
  const [creditsCompleted, setCreditsCompleted] = useState('')
  const [hasDoneThesis, setHasDoneThesis] = useState('false')

  // Faculty Fields
  const [facInitial, setFacInitial] = useState('')
  const [rank, setRank] = useState('Assistant Professor')
  const [ugPg, setUgPg] = useState('Undergraduate')
  const [semFreeFrom, setSemFreeFrom] = useState('')
  const [maxGrpPerSem, setMaxGrpPerSem] = useState('3')
  const [totalSupervised, setTotalSupervised] = useState('0')
  const [roomNo, setRoomNo] = useState('')
  const [calendarLink, setCalendarLink] = useState('')

  // Fetch Live Domains from MySQL database
  const fetchDomains = () => {
    fetch(`${API_BASE_URL}/api/domains`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.domains && data.domains.length > 0) {
          const names = data.domains.map((d) => d.domain_name)
          setDomainsList(names)
          if (!selectedDomain) setSelectedDomain(names[0])
        } else {
          const fallback = [
            'Artificial Intelligence & Machine Learning',
            'Data Science & Big Data',
            'Software Engineering & System Architecture',
            'Cybersecurity & Cryptography'
          ]
          setDomainsList(fallback)
          if (!selectedDomain) setSelectedDomain(fallback[0])
        }
      })
      .catch(() => {
        const fallback = [
          'Artificial Intelligence & Machine Learning',
          'Data Science & Big Data',
          'Software Engineering'
        ]
        setDomainsList(fallback)
        if (!selectedDomain) setSelectedDomain(fallback[0])
      })
  }

  useEffect(() => {
    fetchDomains()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusMsg({ type: '', text: '' })
    setLoading(true)

    const finalDomainName = selectedDomain === '__CUSTOM__' ? customDomain : selectedDomain

    try {
      if (authMode === 'signin') {
        const res = await fetch(`${API_BASE_URL}/api/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        })
        const data = await res.json()
        if (data.status === 'ok') {
          setStatusMsg({ type: 'success', text: `Welcome back, ${data.user.name}! Role: ${data.user.role}` })
        } else {
          setStatusMsg({ type: 'error', text: data.message || 'Login failed.' })
        }
      } else if (registerRole === 'student') {
        const payload = {
          name,
          email,
          password,
          gender,
          cgpa: parseFloat(cgpa) || 0.0,
          credits_completed: parseInt(creditsCompleted) || 0,
          has_done_thesis: hasDoneThesis === 'true',
          domain_name: finalDomainName
        }
        const res = await fetch(`${API_BASE_URL}/api/register/student`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.status === 'ok') {
          setStatusMsg({ type: 'success', text: 'Student registered successfully in MySQL! You can now sign in.' })
          setAuthMode('signin')
          fetchDomains()
        } else {
          setStatusMsg({ type: 'error', text: data.message || 'Registration failed.' })
        }
      } else {
        const payload = {
          name,
          email,
          password,
          gender,
          fac_initial: facInitial,
          rank,
          ug_pg: ugPg,
          sem_free_from: semFreeFrom,
          max_grp_per_sem: parseInt(maxGrpPerSem) || 3,
          total_supervised: parseInt(totalSupervised) || 0,
          room_no: roomNo,
          calendar_link: calendarLink,
          domain_name: finalDomainName
        }
        const res = await fetch(`${API_BASE_URL}/api/register/faculty`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const data = await res.json()
        if (data.status === 'ok') {
          setStatusMsg({ type: 'success', text: 'Faculty registered successfully in MySQL! You can now sign in.' })
          setAuthMode('signin')
          fetchDomains()
        } else {
          setStatusMsg({ type: 'error', text: data.message || 'Registration failed.' })
        }
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Failed to connect to backend server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 py-12">
      {/* Background glow */}
      <div className="absolute w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-800 backdrop-blur-md">
        {/* Title & Headline */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Thesis Hunt
          </h1>
          <p className="text-slate-400 text-sm">Academic Research & Thesis Repository</p>
        </div>

        {/* Alert notification banner */}
        {statusMsg.text && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/50 text-rose-300'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button type="button" onClick={() => setStatusMsg({ type: '', text: '' })} className="ml-2 text-slate-400 hover:text-slate-200">
              ✕
            </button>
          </div>
        )}

        {/* Auth mode tab switch */}
        <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              authMode === 'signin'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              authMode === 'register'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Role toggle button group */}
        {authMode === 'register' && (
          <div className="flex bg-slate-900 border border-cyan-500/30 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRegisterRole('student')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                registerRole === 'student'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRegisterRole('faculty')}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                registerRole === 'faculty'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Faculty
            </button>
          </div>
        )}

        {/* Registration & Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Alan Turing / Jane Doe"
                required
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.edu"
              required
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Password
              </label>
              {authMode === 'signin' && (
                <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-cyan-400 hover:underline">
                  Forgot?
                </a>
              )}
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          {/* Dynamic sub-form based on chosen registration role */}
          {authMode === 'register' && registerRole === 'student' && (
            <StudentRegisterForm
              cgpa={cgpa}
              setCgpa={setCgpa}
              creditsCompleted={creditsCompleted}
              setCreditsCompleted={setCreditsCompleted}
              hasDoneThesis={hasDoneThesis}
              setHasDoneThesis={setHasDoneThesis}
              selectedDomain={selectedDomain}
              setSelectedDomain={setSelectedDomain}
              customDomain={customDomain}
              setCustomDomain={setCustomDomain}
              domainsList={domainsList}
            />
          )}

          {authMode === 'register' && registerRole === 'faculty' && (
            <FacultyRegisterForm
              facInitial={facInitial}
              setFacInitial={setFacInitial}
              rank={rank}
              setRank={setRank}
              ugPg={ugPg}
              setUgPg={setUgPg}
              semFreeFrom={semFreeFrom}
              setSemFreeFrom={setSemFreeFrom}
              maxGrpPerSem={maxGrpPerSem}
              setMaxGrpPerSem={setMaxGrpPerSem}
              totalSupervised={totalSupervised}
              setTotalSupervised={setTotalSupervised}
              roomNo={roomNo}
              setRoomNo={setRoomNo}
              calendarLink={calendarLink}
              setCalendarLink={setCalendarLink}
              selectedDomain={selectedDomain}
              setSelectedDomain={setSelectedDomain}
              customDomain={customDomain}
              setCustomDomain={setCustomDomain}
              domainsList={domainsList}
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transform transition-all active:scale-[0.99] text-sm mt-4 disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : authMode === 'signin'
              ? 'Sign In'
              : `Complete ${registerRole === 'student' ? 'Student' : 'Faculty'} Registration`}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-800 text-center text-xs text-slate-500">
          {authMode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Register Now
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('signin')}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Sign In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
