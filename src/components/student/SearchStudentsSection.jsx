import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function SearchStudentsSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [hasCompletedThesis, setHasCompletedThesis] = useState(false)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [selectedGender, setSelectedGender] = useState('All')

  // Sort checkboxes state (descending sort when checked)
  const [sortOpts, setSortOpts] = useState({
    cgpa: false,
    credits: false,
    publications: false,
    semesters: false
  })

  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchStudents = useCallback(() => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim())
    }
    if (hasCompletedThesis) {
      params.append('has_completed_thesis', 'true')
    }
    if (availableOnly) {
      params.append('available_only', 'true')
    }
    if (selectedGender && selectedGender !== 'All') {
      params.append('gender', selectedGender)
    }

    // Selected sort fields (applied in order)
    const activeSorts = []
    if (sortOpts.cgpa) activeSorts.push('cgpa')
    if (sortOpts.credits) activeSorts.push('credits')
    if (sortOpts.publications) activeSorts.push('publications')
    if (sortOpts.semesters) activeSorts.push('semesters')

    activeSorts.forEach((sortField) => {
      params.append('sort_by', sortField)
    })

    fetch(`${API_BASE_URL}/api/student/search?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setStudents(data.students || [])
        } else {
          setError(data.message || 'Failed to fetch student search results.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to backend server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchQuery, hasCompletedThesis, availableOnly, selectedGender, sortOpts])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchStudents])

  const handleSortToggle = (key) => {
    setSortOpts((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setHasCompletedThesis(false)
    setAvailableOnly(false)
    setSelectedGender('All')
    setSortOpts({
      cgpa: false,
      credits: false,
      publications: false,
      semesters: false
    })
  }

  const isSortActive = Object.values(sortOpts).some(Boolean)

  const getThesisStatusBadge = (student) => {
    if (student.has_done_thesis) {
      return (
        <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold uppercase">
          Completed thesis
        </span>
      )
    }

    else if (!student.thesis_group) {
      return (
        <span className="bg-sky-950/80 text-sky-300 border border-sky-500/40 px-2.5 py-0.5 rounded-full font-semibold uppercase">
          Finding existing group
        </span>
      )
    }

    const status = (student.formation_status || '').toLowerCase()
    if (status === 'forming') {
      return (
        <span className="bg-amber-950/80 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full font-semibold uppercase">
          Finding members
        </span>
      )
    }

    else if (status === 'pending') {
      return (
        <span className="bg-purple-950/80 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-semibold uppercase">
          Finding supervisor
        </span>
      )
    }

    else if (status === 'approved') {
      return (
        <span className="bg-teal-950/80 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full font-semibold uppercase">
          thesis in progress
        </span>
      )
    }

    // return (
    //   <span className="bg-teal-950/80 text-teal-300 border border-teal-500/40 px-2.5 py-0.5 rounded-full font-semibold">
    //     thesis in progress
    //   </span>
    // )
  }

  return (
    <div className="max-w-6xl space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
            Student Directory
          </span>
          <h2 className="text-3xl font-bold text-white mt-2">Search Students</h2>
          <p className="text-sm text-slate-400 mt-1">
            Search, filter, and sort student records across the thesis database.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-slate-950 px-5 py-3 rounded-2xl border border-slate-800">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium">Total Results</p>
            <p className="text-lg font-extrabold text-cyan-400">{students.length} Students</p>
          </div>
        </div>
      </div>

      {/* Control Panel: Search Bar, Filters & Sort Checkboxes */}
      <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800 shadow-lg space-y-5">
        {/* Search Bar Input */}
        <div>
          <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
            Search Criteria
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, ID, or research domain"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 pl-11 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all placeholder:text-slate-500 shadow-inner"
            />
            <svg
              className="w-5 h-5 text-slate-500 absolute left-4 top-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3.5 text-xs text-slate-400 hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters & Sort Checkboxes */}
        <div className="flex flex-col md:flex-row items-stretch gap-6 pt-3 border-t border-slate-800">
          {/* Sort By Section (Descending Checkboxes) */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-left">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider items-center">
                Sort By
              </h4>
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider items-center ml-2">[Descending Order]</h3>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-300">
              {/* CGPA Sort Checkbox */}
              <label
                className={`inline-flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.cgpa
                  ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300'
                  : 'border-slate-800 hover:border-slate-700'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sortOpts.cgpa}
                  onChange={() => handleSortToggle('cgpa')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <span>CGPA</span>
              </label>

              {/* Completed Credits Sort Checkbox */}
              <label
                className={`inline-flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.credits
                  ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300'
                  : 'border-slate-800 hover:border-slate-700'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sortOpts.credits}
                  onChange={() => handleSortToggle('credits')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <span>Completed Credits</span>
              </label>

              {/* Number of Publications Sort Checkbox */}
              <label
                className={`inline-flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.publications
                  ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300'
                  : 'border-slate-800 hover:border-slate-700'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sortOpts.publications}
                  onChange={() => handleSortToggle('publications')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <span>Publications</span>
              </label>

              {/* Semesters Completed Sort Checkbox */}
              <label
                className={`inline-flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.semesters
                  ? 'border-cyan-500/50 bg-cyan-950/20 text-cyan-300'
                  : 'border-slate-800 hover:border-slate-700'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sortOpts.semesters}
                  onChange={() => handleSortToggle('semesters')}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <span>Semesters Completed</span>
              </label>
            </div>
          </div>

          {/* Vertical Line Divider */}
          <div className="hidden md:block w-px bg-slate-800 my-1 shrink-0" />

          {/* Filters Section */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-end">
              <h4 className="text-xs font-bold text-cyan-400 uppercase">
                Filter Results
              </h4>
            </div>

            <div className="flex justify-end flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
              {/* Available Students Checkbox */}
              <label className="inline-flex items-center space-x-2.5 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <span>Available students</span>
              </label>

              {/* Has Completed Thesis Checkbox */}
              <label className="inline-flex items-center space-x-2.5 bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 cursor-pointer hover:border-slate-700 transition-all">
                <input
                  type="checkbox"
                  checked={hasCompletedThesis}
                  onChange={(e) => setHasCompletedThesis(e.target.checked)}
                  className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-500 bg-slate-900"
                />
                <span>Has Completed Thesis</span>
              </label>

              {/* Gender Filter Selection */}
              <div className="inline-flex items-center space-x-2 bg-slate-950 px-3.5 py-1.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Gender:</span>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer"
                >
                  <option value="All" className="bg-slate-900 text-slate-200">All</option>
                  <option value="Male" className="bg-slate-900 text-slate-200">Male</option>
                  <option value="Female" className="bg-slate-900 text-slate-200">Female</option>
                  <option value="Other" className="bg-slate-900 text-slate-200">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Filters & Active Filter Indicator */}
        <div className="flex items-center justify-left pt-2 border-t border-slate-800 text-xs">
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-cyan-400 hover:text-cyan-300 font-semibold underline underline-offset-2"
          >
            Reset All Filters & Sort
          </button>
        </div>
      </div>

      {/* Results Display */}
      {error ? (
        <div className="bg-rose-950/80 border border-rose-500/50 text-rose-300 p-5 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-500"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-3">
          <p className="text-lg font-bold text-slate-300">No Students Found</p>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No student matched your search query or filter criteria. Try adjusting your query or resetting filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student) => (
            <div
              key={student.student_id}
              className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 shadow-md hover:border-slate-700 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Top Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-bold text-white leading-snug">{student.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">{student.email}</p>
                </div>
                <span className="shrink-0 text-xs font-black text-cyan-400 bg-cyan-950/60 px-2.5 py-1 rounded-xl border border-cyan-500/30">
                  #{student.student_id}
                </span>
              </div>

              {/* Status & Badges */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                {getThesisStatusBadge(student)}
                {student.gender && (
                  <span className="bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded-full font-medium">
                    {student.gender}
                  </span>
                )}
              </div>

              {/* Preferred Domain */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800">
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Preferred Domain
                </p>
                <p className="text-xs font-bold text-cyan-400 mt-0.5 truncate">
                  {student.preferred_domain || 'Unspecified'}
                </p>
              </div>

              {/* Academic Details Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-800/80 pt-3">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">CGPA</span>
                  <span className="text-sm font-extrabold text-cyan-400">
                    {student.CGPA !== null && student.CGPA !== undefined ? student.CGPA.toFixed(2) : 'N/A'}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Completed Credits</span>
                  <span className="text-sm font-extrabold text-blue-400">
                    {student.credits_completed}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Semesters Completed</span>
                  <span className="text-sm font-extrabold text-emerald-400">
                    {student.semesters_completed}
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Publications</span>
                  <span className="text-sm font-extrabold text-purple-400">
                    {student.num_publications}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
