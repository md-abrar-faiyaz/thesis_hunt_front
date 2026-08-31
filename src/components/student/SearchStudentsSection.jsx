import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function SearchStudentsSection({ initialQuery = '', onNavigateToInbox, user }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)

  const [hasCompletedThesis, setHasCompletedThesis] = useState(false)
  const [availableOnly, setAvailableOnly] = useState(false)
  const [selectedGender, setSelectedGender] = useState('All')

  // Logged-in user's group ID state & invitation status tracking
  const [userGroupId, setUserGroupId] = useState(null)
  const [invitingMap, setInvitingMap] = useState({})
  const [invitedMap, setInvitedMap] = useState({})

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

  // Fetch logged in user's thesis group info to determine if they can send invites
  useEffect(() => {
    if (!user || !user.uid) return
    fetch(`${API_BASE_URL}/api/student/group-channel/${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.has_group && data.group_info) {
          setUserGroupId(data.group_info.group_id)
        }
      })
      .catch(() => {})
  }, [user])

  const handleInviteToGroup = async (targetStudent) => {
    if (!user || !user.uid || !userGroupId) return

    setInvitingMap((prev) => ({ ...prev, [targetStudent.student_id]: true }))
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/group-channel/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.uid,
          receiver_id: targetStudent.student_id,
          group_id: userGroupId
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        setInvitedMap((prev) => ({ ...prev, [targetStudent.student_id]: true }))
      } else {
        alert(data.message || 'Failed to send group invitation.')
      }
    } catch (err) {
      alert('Network error: Failed to send group invitation.')
    } finally {
      setInvitingMap((prev) => ({ ...prev, [targetStudent.student_id]: false }))
    }
  }


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
        <span className="bg-emerald-50 text-emerald-900 border border-emerald-300 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
          Completed thesis
        </span>
      )
    } else if (!student.thesis_group) {
      return (
        <span className="bg-sky-100 text-blue-900 border border-sky-300 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
          Finding existing group
        </span>
      )
    }

    const status = (student.formation_status || '').toLowerCase()
    if (status === 'forming') {
      return (
        <span className="bg-amber-50 text-amber-900 border border-amber-300 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
          Finding members
        </span>
      )
    } else if (status === 'pending') {
      return (
        <span className="bg-purple-50 text-purple-900 border border-purple-300 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
          Pending approval
        </span>
      )
    } else if (status === 'approved') {
      return (
        <span className="bg-teal-50 text-teal-900 border border-teal-300 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
          thesis in progress
        </span>
      )
    }
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Student Directory
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">Search Students</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Search, filter, and sort student records.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-sky-50 px-5 py-3 rounded-2xl border border-sky-200">
          <div className="text-right">
            <p className="text-xs text-black font-bold uppercase">Total Results</p>
            <p className="text-lg font-extrabold text-blue-950">{students.length} Students</p>
          </div>
        </div>
      </div>

      {/* Control Panel: Search Bar, Filters & Sort Checkboxes */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        {/* Search Bar Input */}
        <div>
          <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
            Search Criteria
          </label>
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, ID, or research domain"
              className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 pl-11 text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
            />
            <svg
              className="w-5 h-5 text-slate-400 absolute left-4 top-3.5"
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
                className="absolute right-4 top-3.5 text-xs text-black hover:text-blue-900 font-bold"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Filters & Sort Checkboxes */}
        <div className="flex flex-col md:flex-row items-stretch gap-6 pt-3 border-t border-slate-200">
          {/* Sort By Section (Descending Checkboxes) */}
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-left">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider items-center">
                Sort By
              </h4>
              <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider items-center ml-2">[Descending Order]</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-black">
              {/* CGPA Sort Checkbox */}
              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.cgpa
                  ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                  : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sortOpts.cgpa}
                  onChange={() => handleSortToggle('cgpa')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span>CGPA</span>
              </label>

              {/* Completed Credits Sort Checkbox */}
              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.credits
                  ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                  : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sortOpts.credits}
                  onChange={() => handleSortToggle('credits')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span>Completed Credits</span>
              </label>

              {/* Number of Publications Sort Checkbox */}
              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.publications
                  ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                  : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sortOpts.publications}
                  onChange={() => handleSortToggle('publications')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span>Publications</span>
              </label>

              {/* Semesters Completed Sort Checkbox */}
              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.semesters
                  ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                  : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={sortOpts.semesters}
                  onChange={() => handleSortToggle('semesters')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span>Semesters Completed</span>
              </label>
            </div>
          </div>

          {/* Vertical Line Divider */}
          <div className="hidden md:block w-px bg-slate-200 my-1 shrink-0" />

          {/* Filters Section */}
          <div className="flex-1 space-y-3">
            <div className="flex justify-start md:justify-end">
              <h4 className="text-xs font-bold text-blue-950 uppercase">
                Filter Results
              </h4>
            </div>

            <div className="flex justify-start md:justify-end flex-wrap items-center gap-3 text-xs font-semibold text-black">
              {/* Available Students Checkbox */}
              <label className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border cursor-pointer transition-all ${availableOnly ? 'bg-sky-100 border-sky-300 text-blue-950 font-bold' : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-black'}`}>
                <input
                  type="checkbox"
                  checked={availableOnly}
                  onChange={(e) => setAvailableOnly(e.target.checked)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span>Available students</span>
              </label>

              {/* Has Completed Thesis Checkbox */}
              <label className={`inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border cursor-pointer transition-all ${hasCompletedThesis ? 'bg-sky-100 border-sky-300 text-blue-950 font-bold' : 'bg-white border-slate-200 hover:border-sky-300 hover:bg-sky-50 text-black'}`}>
                <input
                  type="checkbox"
                  checked={hasCompletedThesis}
                  onChange={(e) => setHasCompletedThesis(e.target.checked)}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span>Has Completed Thesis</span>
              </label>

              {/* Gender Filter Selection */}
              <div className="inline-flex items-center space-x-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200">
                <span className="text-slate-600 font-semibold">Gender:</span>
                <select
                  value={selectedGender}
                  onChange={(e) => setSelectedGender(e.target.value)}
                  className="bg-transparent text-black font-bold focus:outline-none cursor-pointer"
                >
                  <option value="All">All</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Reset Filters & Active Filter Indicator */}
        <div className="flex items-center justify-left pt-2 border-t border-slate-200 text-xs">
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-blue-900 hover:text-blue-950 font-bold underline underline-offset-2 cursor-pointer"
          >
            Reset All Filters & Sort
          </button>
        </div>
      </div>

      {/* Results Display */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <p className="text-lg font-bold text-black">No Students Found</p>
          <p className="text-xs text-black font-medium max-w-md mx-auto">
            No student matched your search query or filter criteria. Try adjusting your query or resetting filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {students.map((student) => (
            <div
              key={student.student_id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Top Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-extrabold text-black leading-snug">{student.name}</h3>
                  <p className="text-xs text-black mt-0.5 truncate font-medium">{student.email}</p>
                </div>
                <span className="shrink-0 text-xs font-black text-blue-950 bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200">
                  #{student.student_id}
                </span>
              </div>

              {/* Status & Badges */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                {getThesisStatusBadge(student)}
                {student.gender && (
                  <span className="bg-sky-50 text-blue-950 border border-sky-200 px-2 py-0.5 rounded-full font-semibold">
                    {student.gender}
                  </span>
                )}
              </div>

              {/* Preferred Domain */}
              <div className="bg-sky-50 p-3 rounded-2xl border border-sky-200">
                <p className="text-[10px] text-blue-900 uppercase font-bold tracking-wider">
                  Preferred Domain
                </p>
                <p className="text-xs font-extrabold text-blue-950 mt-0.5 truncate">
                  {student.preferred_domain || 'Unspecified'}
                </p>
              </div>

              {/* Academic Details Metrics Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-black uppercase font-bold tracking-wider block">CGPA</span>
                  <span className="text-sm font-extrabold text-blue-950">
                    {student.CGPA !== null && student.CGPA !== undefined ? student.CGPA.toFixed(2) : 'N/A'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-black uppercase font-bold tracking-wider block">Completed Credits</span>
                  <span className="text-sm font-extrabold text-blue-900">
                    {student.credits_completed}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-black uppercase font-bold tracking-wider block">Semesters Completed</span>
                  <span className="text-sm font-extrabold text-black">
                    {student.semesters_completed}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-black uppercase font-bold tracking-wider block">Publications</span>
                  <span className="text-sm font-extrabold text-blue-950">
                    {student.num_publications}
                  </span>
                </div>
              </div>

              {/* Card Action Buttons: Invite to Group & Send Message */}
              <div className="space-y-2 mt-2">
                {userGroupId &&
                  user?.uid !== student.student_id &&
                  !student.has_done_thesis &&
                  !student.thesis_group && (
                    <button
                      type="button"
                      disabled={invitingMap[student.student_id] || invitedMap[student.student_id]}
                      onClick={() => handleInviteToGroup(student)}
                      className={`w-full py-2.5 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 border cursor-pointer ${
                        invitedMap[student.student_id]
                          ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          : 'bg-emerald-700 hover:bg-emerald-800 text-white border-emerald-700'
                      }`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>
                        {invitedMap[student.student_id]
                          ? 'Invitation Sent ✓'
                          : invitingMap[student.student_id]
                          ? 'Sending Invite...'
                          : 'Invite to Group'}
                      </span>
                    </button>
                  )}

                {onNavigateToInbox && (
                  <button
                    type="button"
                    onClick={() =>
                      onNavigateToInbox({
                        partner_id: student.student_id,
                        partner_name: student.name,
                        partner_role: 'Student'
                      })
                    }
                    className="w-full py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span>Send Message</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


