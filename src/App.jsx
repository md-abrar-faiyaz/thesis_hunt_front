import { useState, useEffect } from 'react'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  // If path starts with /db (e.g. /db), render Database Inspector GUI
  if (currentPath.startsWith('/db')) {
    return <DatabaseInspector />
  }

  // Default path /: Render Login Interface
  return <LoginInterface />
}

// ----------------------------------------------------------------------
// LOGIN & REGISTRATION INTERFACE COMPONENT (Rendered at /)
// ----------------------------------------------------------------------
function LoginInterface() {
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

  // Fetch Live Domains from MySQL
  const fetchDomains = () => {
    fetch('http://127.0.0.1:8000/api/domains')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.domains && data.domains.length > 0) {
          const names = data.domains.map((d) => d.domain_name)
          setDomainsList(names)
          if (!selectedDomain) setSelectedDomain(names[0])
        } else {
          // Fallback default domain list if DB has no domains yet
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
        const res = await fetch('http://127.0.0.1:8000/api/login', {
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
        const res = await fetch('http://127.0.0.1:8000/api/register/student', {
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
        const res = await fetch('http://127.0.0.1:8000/api/register/faculty', {
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
      {/* Glow Effect */}
      <div className="absolute w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-2xl max-w-xl w-full border border-slate-800 backdrop-blur-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-2">
            Thesis Hunt
          </h1>
          <p className="text-slate-400 text-sm">Academic Research & Thesis Repository</p>
        </div>

        {/* Status Alert Banner */}
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

        {/* Auth Mode Toggle (Sign In vs Register) */}
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

        {/* Role Toggle for Registration */}
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
              🎓 Student
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
              👨‍🏫 Faculty
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Common Registration Fields */}
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

          {/* Email Address (Strictly Email, No Username) */}
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

          {/* Password */}
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

          {/* Gender (Registration common) */}
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

          {/* STUDENT SPECIFIC FIELDS */}
          {authMode === 'register' && registerRole === 'student' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="4.00"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="3.85"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Credits Completed
                  </label>
                  <input
                    type="number"
                    value={creditsCompleted}
                    onChange={(e) => setCreditsCompleted(e.target.value)}
                    placeholder="112"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Has Completed Thesis Previously?
                </label>
                <select
                  value={hasDoneThesis}
                  onChange={(e) => setHasDoneThesis(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                >
                  <option value="false">No (First Thesis)</option>
                  <option value="true">Yes</option>
                </select>
              </div>

              {/* Preferred Domain Search / Add New */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Preferred Research Domain
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all mb-2"
                >
                  {domainsList.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                  <option value="__CUSTOM__">➕ Add / Type New Custom Domain</option>
                </select>

                {selectedDomain === '__CUSTOM__' && (
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="Enter your custom domain name (e.g. Quantum Computing)"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-cyan-500/60 rounded-xl text-cyan-300 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                )}
              </div>
            </>
          )}

          {/* FACULTY SPECIFIC FIELDS */}
          {authMode === 'register' && registerRole === 'faculty' && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Faculty Initial
                  </label>
                  <input
                    type="text"
                    value={facInitial}
                    onChange={(e) => setFacInitial(e.target.value)}
                    placeholder="MDF"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Designation / Rank
                  </label>
                  <select
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  >
                    <option value="Professor">Professor</option>
                    <option value="Associate Professor">Associate Professor</option>
                    <option value="Assistant Professor">Assistant Professor</option>
                    <option value="Senior Lecturer">Senior Lecturer</option>
                    <option value="Lecturer">Lecturer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    UG / PG Focus
                  </label>
                  <select
                    value={ugPg}
                    onChange={(e) => setUgPg(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  >
                    <option value="Undergraduate">Undergraduate (UG)</option>
                    <option value="Postgraduate">Postgraduate (PG)</option>
                    <option value="Both">Both (UG & PG)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Semester Free From
                  </label>
                  <input
                    type="text"
                    value={semFreeFrom}
                    onChange={(e) => setSemFreeFrom(e.target.value)}
                    placeholder="Fall 2026"
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Max Groups / Sem
                  </label>
                  <input
                    type="number"
                    value={maxGrpPerSem}
                    onChange={(e) => setMaxGrpPerSem(e.target.value)}
                    placeholder="4"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Total Supervised
                  </label>
                  <input
                    type="number"
                    value={totalSupervised}
                    onChange={(e) => setTotalSupervised(e.target.value)}
                    placeholder="0"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={roomNo}
                    onChange={(e) => setRoomNo(e.target.value)}
                    placeholder="UB70102"
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                    Calendar Link
                  </label>
                  <input
                    type="url"
                    value={calendarLink}
                    onChange={(e) => setCalendarLink(e.target.value)}
                    placeholder="https://calendar.google.com/..."
                    className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              {/* Work On Domain Search / Add New */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
                  Research Domain (Work On Domain)
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all mb-2"
                >
                  {domainsList.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                  <option value="__CUSTOM__">➕ Add / Type New Custom Domain</option>
                </select>

                {selectedDomain === '__CUSTOM__' && (
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="Enter custom research domain name"
                    required
                    className="w-full px-4 py-2.5 bg-slate-950 border border-cyan-500/60 rounded-xl text-cyan-300 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full py-3.5 px-6 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-cyan-500/20 transform transition-all active:scale-[0.99] text-sm mt-4"
          >
            {authMode === 'signin'
              ? 'Sign In'
              : `Complete ${registerRole === 'student' ? 'Student' : 'Faculty'} Registration`}
          </button>
        </form>

        {/* Footer Toggle */}
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


// ----------------------------------------------------------------------
// DATABASE INSPECTOR COMPONENT (Rendered only at /db)
// ----------------------------------------------------------------------
function DatabaseInspector() {
  const [apiMessage, setApiMessage] = useState('Connecting to backend...')
  const [healthStatus, setHealthStatus] = useState(null)
  const [dbData, setDbData] = useState({})
  const [loadingDb, setLoadingDb] = useState(false)
  const [selectedTable, setSelectedTable] = useState('')
  const [viewMode, setViewMode] = useState('tabular')

  const fetchBackendData = () => {
    fetch('http://127.0.0.1:8000/')
      .then((res) => res.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage('Failed to connect to backend server'))

    fetch('http://127.0.0.1:8000/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'error', db_connection: 'Backend unavailable' }))

    setLoadingDb(true)
    fetch('http://127.0.0.1:8000/api/tables')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setDbData(data.tables || {})
          const tableNames = Object.keys(data.tables || {})
          if (tableNames.length > 0 && !selectedTable) {
            setSelectedTable(tableNames[0])
          }
        }
      })
      .catch((err) => console.error('Error fetching database tables:', err))
      .finally(() => setLoadingDb(false))
  }

  useEffect(() => {
    fetchBackendData()
  }, [])

  const tableNames = Object.keys(dbData)
  const currentRows = selectedTable ? dbData[selectedTable] || [] : []
  const columns = currentRows.length > 0 ? Object.keys(currentRows[0]) : []

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Thesis Hunt
          </h1>
          <p className="text-slate-400 text-sm mt-1">Academic Database Explorer & API Portal</p>
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${apiMessage.includes('Welcome') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="text-xs text-slate-300 font-medium">{apiMessage}</span>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${healthStatus?.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className="text-xs text-slate-300 font-medium">
              {healthStatus ? `DB: ${healthStatus.db_connection}` : 'Checking DB...'}
            </span>
          </div>

          <button
            onClick={fetchBackendData}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-cyan-400 transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Main Database Content */}
      <main className="flex-1 flex flex-col gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Database Inspector</h2>
              <p className="text-xs text-slate-400">View real-time records directly fetched from MySQL database</p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700/50">
              <button
                onClick={() => setViewMode('tabular')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'tabular'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tabular View
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'json'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON View
              </button>
            </div>
          </div>

          {/* Table Selector Tabs */}
          {loadingDb ? (
            <div className="py-12 text-center text-slate-400 animate-pulse">
              Loading database tables...
            </div>
          ) : tableNames.length === 0 ? (
            <div className="py-12 text-center bg-slate-900/40 rounded-xl border border-slate-700/30">
              <p className="text-slate-300 font-medium">No database tables found or database connection pending.</p>
              <p className="text-xs text-slate-500 mt-1">Make sure your Aiven database credentials are configured in <code className="text-cyan-400">backend/.env</code></p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700/50 pb-4">
                {tableNames.map((tableName) => (
                  <button
                    key={tableName}
                    onClick={() => setSelectedTable(tableName)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedTable === tableName
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/60 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-slate-700/40'
                    }`}
                  >
                    {tableName} <span className="ml-1.5 px-2 py-0.5 bg-slate-950/40 rounded-full text-[10px] text-cyan-300">{dbData[tableName]?.length || 0}</span>
                  </button>
                ))}
              </div>

              {/* View Output */}
              {viewMode === 'tabular' ? (
                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/60">
                  {currentRows.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      Table <span className="font-semibold text-cyan-400">"{selectedTable}"</span> is empty.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800/80 text-cyan-400 uppercase font-mono border-b border-slate-700/50">
                        <tr>
                          {columns.map((col) => (
                            <th key={col} className="px-4 py-3 font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {currentRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            {columns.map((col) => (
                              <td key={col} className="px-4 py-3 whitespace-nowrap">
                                {row[col] === null ? (
                                  <span className="text-slate-600 italic">null</span>
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                  <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
                    {JSON.stringify(selectedTable ? { [selectedTable]: currentRows } : dbData, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default App



