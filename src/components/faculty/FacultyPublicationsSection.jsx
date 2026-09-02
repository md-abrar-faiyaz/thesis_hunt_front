import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyPublicationsSection({ user }) {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'my'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Add Publication Modal State
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('A*')
  const [pubDate, setPubDate] = useState('')
  const [paperLink, setPaperLink] = useState('')
  const [domainsList, setDomainsList] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [modalError, setModalError] = useState('')

  const fetchPublications = useCallback(() => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim())
    }
    if (selectedCategory && selectedCategory !== 'All') {
      params.append('journal_category', selectedCategory)
    }
    if (activeTab === 'my' && user && user.uid) {
      params.append('author_id', user.uid)
    }
    // Sort by date descending
    params.append('sort_by_date', 'desc')

    fetch(`${API_BASE_URL}/api/faculty/publications?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          const rawPubs = data.publications || []
          // Ensure newer ones on top (sort descending by date or publication_id)
          const sortedPubs = [...rawPubs].sort((a, b) => {
            const dateA = a.publication_date ? new Date(a.publication_date).getTime() : 0
            const dateB = b.publication_date ? new Date(b.publication_date).getTime() : 0
            if (dateB !== dateA) return dateB - dateA
            return (b.publication_id || 0) - (a.publication_id || 0)
          })
          setPublications(sortedPubs)
        } else {
          setError(data.message || 'Failed to load publications.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to publications server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchQuery, selectedCategory, activeTab, user])

  const fetchDomains = () => {
    fetch(`${API_BASE_URL}/api/domains`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.domains && data.domains.length > 0) {
          const names = data.domains.map((d) => d.domain_name)
          setDomainsList(names)
          if (!selectedDomain) setSelectedDomain(names[0])
        } else {
          const fallback = ['Machine Learning', 'Software Engineering', 'Computer Vision', 'Robotics']
          setDomainsList(fallback)
          if (!selectedDomain) setSelectedDomain(fallback[0])
        }
      })
      .catch(() => {
        const fallback = ['Machine Learning', 'Software Engineering']
        setDomainsList(fallback)
        if (!selectedDomain) setSelectedDomain(fallback[0])
      })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPublications()
    }, 200)
    return () => clearTimeout(timer)
  }, [fetchPublications])

  useEffect(() => {
    fetchDomains()
  }, [])

  const handleOpenModal = () => {
    setTitle('')
    setCategory('A*')
    setPubDate('')
    setPaperLink('')
    setCustomDomain('')
    if (domainsList.length > 0) setSelectedDomain(domainsList[0])
    setModalError('')
    setShowPublishModal(true)
  }

  const handlePublishPaper = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      setModalError('Paper title is required.')
      return
    }

    const finalDomain = selectedDomain === '__CUSTOM__' ? customDomain.trim() : selectedDomain
    if (!finalDomain) {
      setModalError('Please select or specify a research domain.')
      return
    }

    setPublishing(true)
    setModalError('')
    setStatusMsg('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/faculty/publications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          journal_category: category,
          publication_date: pubDate || null,
          link: paperLink.trim() || null,
          domain_name: finalDomain,
          authors: [{ author_id: user.uid, author_order: 1 }]
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setStatusMsg('Publication added successfully!')
        setShowPublishModal(false)
        fetchPublications()
      } else {
        setModalError(data.message || 'Failed to add publication.')
      }
    } catch {
      setModalError('Network error: Failed to add publication.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Academic Literature Repository
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">Faculty Publications</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Browse published journal papers, conference proceedings, and research literature.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenModal}
          className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Publication</span>
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-semibold flex justify-between items-center">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg('')} className="text-emerald-900 font-bold cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Navigation Sub-Tabs: All Publications vs My Publications */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-black border border-slate-200'
          }`}
        >
          All Publications
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('my')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all cursor-pointer flex items-center space-x-1.5 ${
            activeTab === 'my'
              ? 'bg-blue-900 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-black border border-slate-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>My Publications</span>
        </button>
      </div>

      {/* Search & Journal Category Filter Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Search Bar Input */}
          <div className="sm:col-span-2 space-y-1.5">
            <label className="block text-xs font-bold text-black uppercase tracking-wider">
              {activeTab === 'my' ? 'Search My Publications' : 'Search Publications'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={activeTab === 'my' ? 'Search your published papers or domain' : 'Search by publication title or topic domain'}
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-2.5 pl-11 text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
              />
              <svg
                className="w-5 h-5 text-slate-400 absolute left-4 top-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-3 text-xs text-black hover:text-blue-900 font-bold cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Journal Category Dropdown Filter */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-black uppercase tracking-wider">
              Journal Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-2.5 text-black text-sm font-semibold focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all cursor-pointer"
            >
              <option value="All">All Categories</option>
              <option value="A*">A*</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
              <option value="Q1">Q1</option>
              <option value="Q2">Q2</option>
              <option value="Q3">Q3</option>
              <option value="Q4">Q4</option>
              <option value="Conference">Conference</option>
              <option value="Journal">Journal</option>
            </select>
          </div>
        </div>
      </div>

      {/* Publications Feed List (Vertical List Layout, Newer ones on top) */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : publications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <p className="text-lg font-bold text-black">
            {activeTab === 'my' ? 'No Publications Added Yet' : 'No Publications Found'}
          </p>
          <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
            {activeTab === 'my'
              ? searchQuery || selectedCategory !== 'All'
                ? 'No publication matching your search or category filter was found in your publications.'
                : 'You have not added any published papers yet. Click "Add Publication" above to register your papers!'
              : searchQuery || selectedCategory !== 'All'
              ? 'No publication matched your search or category filter. Try clearing filters.'
              : 'Be the first to add a research paper or publication!'}
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {publications.map((pub) => {
            return (
              <article
                key={pub.publication_id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition-all space-y-4"
              >
                {/* Header: Title & Category / Domain Badges */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-blue-950 leading-snug">
                      {pub.title}
                    </h3>
                    <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium flex-wrap gap-1">
                      <span>
                        Publication Date: <strong className="text-black font-semibold">{pub.formatted_date || pub.publication_date || 'N/A'}</strong>
                      </span>
                      {pub.journal_category && (
                        <span>
                          Category: <strong className="text-blue-950 font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">{pub.journal_category}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {pub.domain_name && (
                    <span className="shrink-0 bg-sky-100 text-blue-950 border border-sky-200 px-3 py-1 rounded-full text-xs font-bold self-start">
                      {pub.domain_name}
                    </span>
                  )}
                </div>

                {/* Authors List Roster */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Authors ({pub.authors ? pub.authors.length : 0})
                  </span>
                  {pub.authors && pub.authors.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {pub.authors.map((author, idx) => (
                        <div
                          key={`${pub.publication_id}-${author.author_id || idx}-${author.author_order || idx}`}
                          className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-xs"
                        >
                          <span className="font-extrabold text-slate-500 text-[10px]">
                            #{author.author_order || idx + 1}
                          </span>
                          <span className="font-bold text-blue-900">
                            {author.author_name || author.name} {author.role ? `(${author.role})` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">No authors listed</p>
                  )}
                </div>

                {/* DOI / External Paper Link */}
                {pub.link && (
                  <div className="pt-2 flex items-center justify-end">
                    <a
                      href={pub.link.startsWith('http') ? pub.link : `https://${pub.link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-sky-50 hover:bg-sky-100 border border-sky-200 text-blue-950 font-bold text-xs rounded-xl transition-all shadow-2xs"
                    >
                      <span>DOI / View Paper</span>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}

      {/* ADD PUBLICATION MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-5 relative">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-black">Publish Research Paper</h3>
                <p className="text-xs text-slate-600 font-medium">
                  Add publication metadata to the database repository.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="p-1 text-slate-400 hover:text-black text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {modalError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-xl text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handlePublishPaper} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Paper Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Graph Neural Networks for Database Query Optimization"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black text-sm focus:outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Journal / Conference Category <span className="text-rose-600">*</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black text-sm focus:outline-none focus:border-blue-900"
                >
                  <option value="A*">A* (Top Tier Conference)</option>
                  <option value="A">A (Conference)</option>
                  <option value="B">B (Conference)</option>
                  <option value="C">C (Conference)</option>
                  <option value="Q1">Q1 (Journal)</option>
                  <option value="Q2">Q2 (Journal)</option>
                  <option value="Q3">Q3 (Journal)</option>
                  <option value="Q4">Q4 (Journal)</option>
                  <option value="Conference">Conference Proceeding</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Publication Date
                </label>
                <input
                  type="date"
                  value={pubDate}
                  onChange={(e) => setPubDate(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black text-sm focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Research Domain <span className="text-rose-600">*</span>
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black text-sm focus:outline-none focus:border-blue-900"
                >
                  {domainsList.map((dom, i) => (
                    <option key={i} value={dom}>
                      {dom}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Add Custom Domain...</option>
                </select>
              </div>

              {selectedDomain === '__CUSTOM__' && (
                <div>
                  <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                    Custom Domain Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="e.g. Distributed Database Systems"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black text-sm focus:outline-none focus:border-blue-900"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Paper Link / DOI URL
                </label>
                <input
                  type="url"
                  value={paperLink}
                  onChange={(e) => setPaperLink(e.target.value)}
                  placeholder="https://doi.org/10.1109/..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black text-sm focus:outline-none focus:border-blue-900"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPublishModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing || !title.trim()}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {publishing ? 'Publishing...' : 'Add Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
