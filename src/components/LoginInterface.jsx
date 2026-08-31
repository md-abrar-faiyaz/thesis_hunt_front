import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'
import StudentRegisterForm from './forms/StudentRegisterForm'
import FacultyRegisterForm from './forms/FacultyRegisterForm'

export default function LoginInterface({ onLoginSuccess }) {
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
  const [semNo, setSemNo] = useState('1')
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
          setPassword('')
          if (onLoginSuccess) {
            const userObj = {
              ...data.user,
              has_done_thesis: Boolean(
                data.user.has_done_thesis === true ||
                data.user.has_done_thesis === 1 ||
                data.user.has_done_thesis === 'true' ||
                data.user.has_done_thesis === '1'
              )
            }
            onLoginSuccess(userObj)
          }
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
          sem_no: parseInt(semNo) || 1,
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
      setStatusMsg({ type: 'error', text: `Failed to connect to backend server at ${API_BASE_URL}. Please ensure backend server is running.` })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 py-12 relative overflow-hidden">
      {/* Background subtle pastel blue glow */}
      <div className="absolute w-[32rem] h-[32rem] bg-sky-100/60 rounded-full blur-3xl pointer-events-none -top-20 -left-20"></div>
      <div className="absolute w-[28rem] h-[28rem] bg-sky-50/80 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20"></div>

      <div className="relative bg-white p-8 sm:p-10 rounded-3xl shadow-xl max-w-xl w-full border border-slate-200">
        {/* Title & Headline */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-blue-950 mb-2 tracking-tight">
            Thesis Hunt
          </h1>
          <p className="text-black text-sm font-medium">Academic Research & Thesis Repository</p>
        </div>

        {/* Alert notification banner */}
        {statusMsg.text && (
          <div
            className={`mb-6 p-4 rounded-xl text-xs font-semibold flex items-center justify-between border ${
              statusMsg.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <span>{statusMsg.text}</span>
            <button type="button" onClick={() => setStatusMsg({ type: '', text: '' })} className="ml-2 text-black hover:text-rose-900">
              ✕
            </button>
          </div>
        )}

        {/* Auth mode tab switch */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 mb-6 shadow-xs">
          <button
            type="button"
            onClick={() => setAuthMode('signin')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              authMode === 'signin'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-black hover:text-blue-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('register')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
              authMode === 'register'
                ? 'bg-blue-900 text-white shadow-sm'
                : 'text-black hover:text-blue-900'
            }`}
          >
            Register
          </button>
        </div>

        {/* Role toggle button group */}
        {authMode === 'register' && (
          <div className="flex bg-sky-50 border border-sky-200 p-1.5 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => setRegisterRole('student')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                registerRole === 'student'
                  ? 'bg-white text-blue-950 border border-sky-300 shadow-sm'
                  : 'text-black hover:text-blue-900'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => setRegisterRole('faculty')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                registerRole === 'faculty'
                  ? 'bg-white text-blue-950 border border-sky-300 shadow-sm'
                  : 'text-black hover:text-blue-900'
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
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Alan Turing / Jane Doe"
                required
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@university.edu"
              required
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-black">
                Password
              </label>
              {authMode === 'signin' && (
                <a href="#" onClick={(e) => e.preventDefault()} className="text-xs text-blue-900 font-semibold hover:underline">
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
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
            />
          </div>

          {authMode === 'register' && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
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
              semNo={semNo}
              setSemNo={setSemNo}
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
            className="w-full py-3.5 px-6 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.99] text-sm mt-4 disabled:opacity-50"
          >
            {loading
              ? 'Processing...'
              : authMode === 'signin'
              ? 'Sign In'
              : `Complete ${registerRole === 'student' ? 'Student' : 'Faculty'} Registration`}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-200 text-center text-xs text-black font-medium">
          {authMode === 'signin' ? (
            <>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setAuthMode('register')}
                className="text-blue-900 font-bold hover:underline"
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
                className="text-blue-900 font-bold hover:underline"
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
