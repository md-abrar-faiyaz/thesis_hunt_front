import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function ThesisGroupSection({ user, onNavigateToGroupChannel }) {
  const [formingGroups, setFormingGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [userHasGroup, setUserHasGroup] = useState(false)
  const [userGroupId, setUserGroupId] = useState(null)

  const [requestingMap, setRequestingMap] = useState({})
  const [requestedMap, setRequestedMap] = useState({})

  // Search filter states
  const [searchDomain, setSearchDomain] = useState('')
  const [searchSupervisor, setSearchSupervisor] = useState('')
  const [searchSemester, setSearchSemester] = useState('')

  // Fetch student's own group status and list of forming groups
  useEffect(() => {
    fetchFormingGroups()
    checkUserGroupStatus()
  }, [user])

  const checkUserGroupStatus = async () => {
    if (!user || !user.uid) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/group-channel/${user.uid}`)
      const data = await res.json()
      if (data.status === 'ok' && data.has_group) {
        setUserHasGroup(true)
        setUserGroupId(data.group_info?.group_id || null)
      } else {
        setUserHasGroup(false)
        setUserGroupId(null)
      }
    } catch (err) {
      // Fail silently
    }
  }

  const fetchFormingGroups = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/forming-groups`)
      const data = await res.json()
      if (data.status === 'ok') {
        setFormingGroups(data.groups || [])
      } else {
        setError(data.message || 'Failed to fetch forming thesis groups.')
      }
    } catch (err) {
      setError('Network error: Failed to connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleAskToJoin = async (groupId) => {
    if (!user || !user.uid) return

    setRequestingMap((prev) => ({ ...prev, [groupId]: true }))
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/group/join-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.uid,
          group_id: groupId
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        setRequestedMap((prev) => ({ ...prev, [groupId]: true }))
      } else {
        alert(data.message || 'Failed to send join request.')
      }
    } catch (err) {
      alert('Network error: Failed to submit join request.')
    } finally {
      setRequestingMap((prev) => ({ ...prev, [groupId]: false }))
    }
  }

  // Filter groups based on search inputs
  const filteredGroups = formingGroups.filter((group) => {
    const domainQuery = searchDomain.trim().toLowerCase()
    const domainMatch = !domainQuery || (group.domain && group.domain.toLowerCase().includes(domainQuery))

    const supQuery = searchSupervisor.trim().toLowerCase()
    const supervisorMatch = !supQuery || (group.supervisors && group.supervisors.some((sup) =>
      (sup.name && sup.name.toLowerCase().includes(supQuery)) ||
      (sup.Fac_initial && sup.Fac_initial.toLowerCase().includes(supQuery))
    ))

    const semQuery = searchSemester.trim().toLowerCase()
    const semesterMatch = !semQuery || (group.supervisors && group.supervisors.some((sup) =>
      sup.semester && sup.semester.toLowerCase().includes(semQuery)
    ))

    return domainMatch && supervisorMatch && semesterMatch
  })

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Top Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Available Thesis Groups
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">Thesis Groups</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Explore groups currently recruiting members. Submit a join request to be a member of any group and work together.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-blue-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">Search & Filter Groups</h3>
          </div>
          {(searchDomain || searchSupervisor || searchSemester) && (
            <button
              type="button"
              onClick={() => {
                setSearchDomain('')
                setSearchSupervisor('')
                setSearchSemester('')
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-bold underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Domain Filter */}
          <div>
            <label className="block text-xs font-bold text-black mb-1.5">Search by Domain</label>
            <input
              type="text"
              value={searchDomain}
              onChange={(e) => setSearchDomain(e.target.value)}
              placeholder="Machine Learning, Data Science etc"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
            />
          </div>

          {/* Supervisor / Co-Supervisor Filter */}
          <div>
            <label className="block text-xs font-bold text-black mb-1.5">Supervisor / Co-Supervisor Name</label>
            <input
              type="text"
              value={searchSupervisor}
              onChange={(e) => setSearchSupervisor(e.target.value)}
              placeholder="Dr. Nusrat Jahan, NUJ etc"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
            />
          </div>

          {/* Semester Filter */}
          <div>
            <label className="block text-xs font-bold text-black mb-1.5">Semester of Supervision</label>
            <input
              type="text"
              value={searchSemester}
              onChange={(e) => setSearchSemester(e.target.value)}
              placeholder="Spring2026, Fall2025 etc"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-black placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white transition-all"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <p className="text-lg font-bold text-black">No Matching Thesis Groups Found</p>
          <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
            {formingGroups.length === 0
              ? 'There are currently no thesis groups in the forming stage looking for new members.'
              : 'No groups matched your search criteria. Try adjusting or clearing your filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredGroups.map((group) => {
            const isMyGroup = userGroupId === group.group_id
            const isRequested = requestedMap[group.group_id]
            const isRequesting = requestingMap[group.group_id]

            return (
              <div
                key={group.group_id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between space-y-5"
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-xs font-black text-blue-950 bg-sky-100 px-2.5 py-0.5 rounded-lg border border-sky-200">
                        Group #{group.group_id}
                      </span>
                    </div>
                    <h3 className="text-lg font-extrabold text-black leading-snug">{group.title}</h3>
                  </div>

                  <span className="shrink-0 text-xs font-extrabold text-blue-950 bg-sky-50 px-3 py-1 rounded-xl border border-sky-200">
                    {group.domain}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-black font-medium leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  {group.description}
                </p>

                {/* Group Members Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                    Group Members ({group.members?.length || 0})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.members && group.members.length > 0 ? (
                      group.members.map((member) => (
                        <div
                          key={member.student_id}
                          className="bg-sky-50/70 p-3 rounded-2xl border border-sky-100 flex items-center space-x-3"
                        >
                          <div className="w-8 h-8 rounded-xl bg-sky-200 text-blue-950 font-bold flex items-center justify-center text-xs shrink-0">
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-black truncate">{member.name}</p>
                            <p className="text-[10px] text-slate-600 font-medium">
                              CGPA: <span className="font-bold text-blue-950">{member.CGPA ? member.CGPA.toFixed(2) : 'N/A'}</span>
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500 italic">No members assigned yet.</p>
                    )}
                  </div>
                </div>

                {/* Faculty Supervisors Section */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                    Supervisors ({group.supervisors?.length || 0})
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {group.supervisors && group.supervisors.length > 0 ? (
                      group.supervisors.map((sup) => (
                        <div
                          key={sup.supervisor_id}
                          className="bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl text-xs flex items-center space-x-2"
                        >
                          <span className="font-bold text-purple-950">{sup.name}</span>
                          <span className="text-[10px] font-extrabold text-purple-900 bg-purple-100 px-1.5 py-0.5 rounded-md">
                            {sup.role}
                          </span>
                          {sup.semester && (
                            <span className="text-[10px] font-bold text-purple-800 bg-purple-100/70 px-1.5 py-0.5 rounded-md border border-purple-200">
                              Sem: {sup.semester}
                            </span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-xs text-slate-500 italic">No supervisor assigned yet.</span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Area */}
                <div className="pt-2 border-t border-slate-100">
                  {isMyGroup ? (
                    <div className="w-full py-2.5 bg-sky-100 text-blue-950 border border-sky-200 text-center rounded-2xl text-xs font-bold">
                      Your Group ✓
                    </div>
                  ) : userHasGroup ? (
                    <div className="w-full py-2.5 bg-slate-100 text-slate-500 border border-slate-200 text-center rounded-2xl text-xs font-bold cursor-not-allowed">
                      Already in a thesis group
                    </div>
                  ) : isRequested ? (
                    <div className="w-full py-2.5 bg-emerald-50 text-emerald-900 border border-emerald-300 text-center rounded-2xl text-xs font-bold flex items-center justify-center space-x-2">
                      <span>Join Request Submitted ✓</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={isRequesting}
                      onClick={() => handleAskToJoin(group.group_id)}
                      className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-extrabold transition-all shadow-xs flex items-center justify-center space-x-2 border border-emerald-700"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      <span>{isRequesting ? 'Submitting Request...' : 'Ask to Join Group'}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
