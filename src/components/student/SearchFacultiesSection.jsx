import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function SearchFacultiesSection({ initialQuery = '' }) {
  const [searchQuery, setSearchQuery] = useState(initialQuery)


  // UG / PG Filter checkboxes
  const [ugPgFilters, setUgPgFilters] = useState({
    undergraduate: false,
    postgraduate: false
  })

  // Designation Filter checkboxes
  const [designationFilters, setDesignationFilters] = useState({
    professor: false,
    associateProf: false,
    assistantProf: false,
    seniorLecturer: false,
    lecturer: false
  })

  // Sort checkboxes (descending order when checked)
  const [sortOpts, setSortOpts] = useState({
    groupsSupervised: false,
    publications: false
  })

  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchFaculties = useCallback(() => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim())
    }

    // UG / PG focus filters
    const selectedUgPg = []
    if (ugPgFilters.undergraduate) selectedUgPg.push('UG')
    if (ugPgFilters.postgraduate) selectedUgPg.push('PG')


    selectedUgPg.forEach((val) => {
      params.append('ug_pg', val)
    })

    // Designation filters
    const selectedDesignations = []
    if (designationFilters.professor) selectedDesignations.push('Professor')
    if (designationFilters.associateProf) selectedDesignations.push('Associate Professor')
    if (designationFilters.assistantProf) selectedDesignations.push('Assistant Professor')
    if (designationFilters.seniorLecturer) selectedDesignations.push('Senior Lecturer')
    if (designationFilters.lecturer) selectedDesignations.push('Lecturer')

    selectedDesignations.forEach((val) => {
      params.append('designations', val)
    })

    // Sort options
    const activeSorts = []
    if (sortOpts.groupsSupervised) activeSorts.push('groups_supervised')
    if (sortOpts.publications) activeSorts.push('publications')

    activeSorts.forEach((sortField) => {
      params.append('sort_by', sortField)
    })

    fetch(`${API_BASE_URL}/api/student/faculties?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setFaculties(data.faculties || [])
        } else {
          setError(data.message || 'Failed to fetch faculty search results.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to backend server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchQuery, ugPgFilters, designationFilters, sortOpts])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchFaculties()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchFaculties])

  const handleUgPgToggle = (key) => {
    setUgPgFilters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleDesignationToggle = (key) => {
    setDesignationFilters((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleSortToggle = (key) => {
    setSortOpts((prev) => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const handleResetFilters = () => {
    setSearchQuery('')
    setUgPgFilters({
      undergraduate: false,
      postgraduate: false,
      both: false
    })
    setDesignationFilters({
      professor: false,
      associateProf: false,
      assistantProf: false,
      seniorLecturer: false,
      lecturer: false
    })
    setSortOpts({
      groupsSupervised: false,
      publications: false
    })
  }

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Faculty Directory
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">Search Faculties</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Search, filter, and sort faculty supervisors across research domains and academic ranks.
          </p>
        </div>

        <div className="flex items-center space-x-3 bg-sky-50 px-5 py-3 rounded-2xl border border-sky-200">
          <div className="text-right">
            <p className="text-xs text-black font-bold uppercase">Total Results</p>
            <p className="text-lg font-extrabold text-blue-950">{faculties.length} Faculties</p>
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
              placeholder="Search by faculty name, initial (e.g. MDF), research domain, or semester free from"
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

        {/* Filters & Sort Checkboxes Grid */}
        <div className="space-y-4 pt-3 border-t border-slate-200">
          {/* Top Row: Sort By & UG/PG Focus */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sort By Section (Descending Checkboxes) */}
            <div className="space-y-2.5">
              <div className="flex items-center">
                <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                  Sort By
                </h4>
                <h3 className="text-[10px] font-semibold text-slate-600 uppercase tracking-wider ml-2">
                  [Descending Order]
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-black">
                {/* Groups Supervised Sort Checkbox */}
                <label
                  className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${sortOpts.groupsSupervised
                      ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={sortOpts.groupsSupervised}
                    onChange={() => handleSortToggle('groupsSupervised')}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                  />
                  <span>Groups Supervised</span>
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
              </div>
            </div>

            {/* UG / PG Focus Filter */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
                Filter by UG / PG Supervision
              </h4>

              <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-black">
                <label
                  className={`inline-flex items-center justify-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${ugPgFilters.undergraduate
                      ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={ugPgFilters.undergraduate}
                    onChange={() => handleUgPgToggle('undergraduate')}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                  />
                  <span>UG</span>
                </label>

                <label
                  className={`inline-flex items-center justify-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${ugPgFilters.postgraduate
                      ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                      : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                    }`}
                >
                  <input
                    type="checkbox"
                    checked={ugPgFilters.postgraduate}
                    onChange={() => handleUgPgToggle('postgraduate')}
                    className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                  />
                  <span>PG</span>
                </label>
              </div>

            </div>
          </div>

          {/* Designation Filter Section */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-blue-950 uppercase tracking-wider">
              Filter by Designation
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 text-xs font-semibold text-black">
              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${designationFilters.professor
                    ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={designationFilters.professor}
                  onChange={() => handleDesignationToggle('professor')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span className="truncate">Professor</span>
              </label>

              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${designationFilters.associateProf
                    ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={designationFilters.associateProf}
                  onChange={() => handleDesignationToggle('associateProf')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span className="truncate">Assoc. Professor</span>
              </label>

              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${designationFilters.assistantProf
                    ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={designationFilters.assistantProf}
                  onChange={() => handleDesignationToggle('assistantProf')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span className="truncate">Asst. Professor</span>
              </label>

              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${designationFilters.seniorLecturer
                    ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={designationFilters.seniorLecturer}
                  onChange={() => handleDesignationToggle('seniorLecturer')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span className="truncate">Senior Lecturer</span>
              </label>

              <label
                className={`inline-flex items-center space-x-2 px-3 py-2 rounded-xl border cursor-pointer transition-all ${designationFilters.lecturer
                    ? 'border-sky-300 bg-sky-100 text-blue-950 font-bold'
                    : 'border-slate-200 bg-white hover:border-sky-300 hover:bg-sky-50 text-black'
                  }`}
              >
                <input
                  type="checkbox"
                  checked={designationFilters.lecturer}
                  onChange={() => handleDesignationToggle('lecturer')}
                  className="rounded border-slate-300 text-blue-900 focus:ring-blue-900 bg-white"
                />
                <span className="truncate">Lecturer</span>
              </label>
            </div>
          </div>
        </div>

        {/* Reset Filters & Summary */}
        <div className="flex items-center justify-left pt-2 border-t border-slate-200 text-xs">
          <button
            type="button"
            onClick={handleResetFilters}
            className="text-blue-900 hover:text-blue-950 font-bold underline underline-offset-2"
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
      ) : faculties.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <p className="text-lg font-bold text-black">No Faculties Found</p>
          <p className="text-xs text-black font-medium max-w-md mx-auto">
            No faculty member matched your search query or filter criteria. Try adjusting your query or resetting filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculties.map((fac) => (
            <div
              key={fac.faculty_id}
              className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md hover:border-sky-300 transition-all flex flex-col justify-between space-y-4"
            >
              {/* Card Top Header */}
              <div className="space-y-1.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-extrabold text-black leading-snug">{fac.name}</h3>
                    <p className="text-xs text-black mt-0.5 truncate font-medium">{fac.email}</p>
                  </div>
                  {fac.fac_initial && (
                    <span className="shrink-0 text-xs font-black text-blue-950 bg-sky-100 px-2.5 py-1 rounded-xl border border-sky-200">
                      {fac.fac_initial}
                    </span>
                  )}
                </div>

                {/* Status & Designation Badges */}
                <div className="flex flex-wrap gap-1.5 text-[11px] pt-1">
                  {fac.designation && (
                    <span className="bg-sky-50 text-blue-950 border border-sky-200 px-2.5 py-0.5 rounded-full font-bold">
                      {fac.designation}
                    </span>
                  )}
                  {fac.ug_pg && (
                    <span className="bg-white text-black border border-slate-200 px-2 py-0.5 rounded-full font-semibold">
                      Focus: {fac.ug_pg}
                    </span>
                  )}
                  {fac.gender && (
                    <span className="bg-white text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-medium">
                      {fac.gender}
                    </span>
                  )}
                </div>
              </div>

              {/* Research Domain */}
              <div className="bg-sky-50 p-3 rounded-2xl border border-sky-200">
                <p className="text-[10px] text-blue-900 uppercase font-bold tracking-wider">
                  Research Domain
                </p>
                <p className="text-xs font-extrabold text-blue-950 mt-0.5 truncate">
                  {fac.research_domain || 'Unspecified Domain'}
                </p>
              </div>

              {/* Academic & Supervision Details Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-black uppercase font-bold tracking-wider block">Free From</span>
                  <span className="text-xs font-extrabold text-blue-950">
                    {fac.sem_free_from || 'Not Specified'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-black uppercase font-bold tracking-wider block">Max Groups / Sem</span>
                  <span className="text-xs font-extrabold text-black">
                    {fac.max_grp_per_sem || 'N/A'}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-black uppercase font-bold tracking-wider block">Groups Supervised</span>
                  <span className="text-xs font-extrabold text-blue-900">
                    {fac.all_supervised_count}
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-[10px] text-black uppercase font-bold tracking-wider block">Publications</span>
                  <span className="text-xs font-extrabold text-blue-950">
                    {fac.num_publications}
                  </span>
                </div>
              </div>

              {/* Footer Details & Action Links */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="text-[11px] text-black font-semibold truncate">
                  {fac.room_no ? `Room: ${fac.room_no}` : 'No room specified'}
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {fac.calendar_link && (
                    <a
                      href={fac.calendar_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-sky-100 hover:bg-sky-200 border border-sky-300 text-blue-950 rounded-lg text-[11px] font-bold transition-all shadow-xs"
                      title="Open Faculty Calendar"
                    >
                      Calendar ↗
                    </a>
                  )}

                  {fac.websites && fac.websites.length > 0 && (
                    <a
                      href={fac.websites[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 bg-blue-900 hover:bg-blue-950 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs"
                      title="Open Faculty Website"
                    >
                      Website ↗
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
