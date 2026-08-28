import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function PublicationsSection({ user, onNavigateToSearch }) {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'my'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Add Publication Modal State
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newJournalCategory, setNewJournalCategory] = useState('A*')
  const [newDate, setNewDate] = useState('')
  const [newLink, setNewLink] = useState('')
  const [domainsList, setDomainsList] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')

  // Authors management in modal
  const [allUsersList, setAllUsersList] = useState([])
  const [selectedAuthors, setSelectedAuthors] = useState([]) // [{ author_id, author_order, name, role }]
  const [selectedAuthorId, setSelectedAuthorId] = useState('')

  const [formMsg, setFormMsg] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchPublications = useCallback(() => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim())
    }
    if (selectedCategory && selectedCategory !== 'All') {
      params.append('category', selectedCategory)
    }
    if (activeTab === 'my' && user && user.uid) {
      params.append('author_id', user.uid)
    }

    fetch(`${API_BASE_URL}/api/student/publications?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setPublications(data.publications || [])
        } else {
          setError(data.message || 'Failed to load publications.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to backend server.')
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

  const fetchUsersList = () => {
    fetch(`${API_BASE_URL}/api/student/users-list`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setAllUsersList(data.users || [])
          if (data.users && data.users.length > 0 && !selectedAuthorId) {
            setSelectedAuthorId(data.users[0].uid.toString())
          }
        }
      })
      .catch(() => {})
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPublications()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchPublications])

  useEffect(() => {
    fetchDomains()
    fetchUsersList()
  }, [])

  // Automatically pre-fill logged in user as first author when opening modal
  const handleOpenAddModal = () => {
    setShowAddModal(true)
    setFormMsg({ type: '', text: '' })
    if (selectedAuthors.length === 0 && user && user.uid) {
      setSelectedAuthors([
        {
          author_id: user.uid,
          author_order: 1,
          name: user.name || 'Me',
          role: user.user_type === 'student' ? 'Student' : 'Faculty'
        }
      ])
    }
  }

  const handleAddAuthorToModal = () => {
    if (!selectedAuthorId) return
    const uidNum = parseInt(selectedAuthorId, 10)
    if (selectedAuthors.some((a) => a.author_id === uidNum)) {
      alert('This author is already added.')
      return
    }

    const found = allUsersList.find((u) => u.uid === uidNum)
    if (!found) return

    const nextOrder = selectedAuthors.length + 1
    setSelectedAuthors([
      ...selectedAuthors,
      {
        author_id: found.uid,
        author_order: nextOrder,
        name: found.name,
        role: found.role
      }
    ])
  }

  const handleRemoveAuthorFromModal = (uid) => {
    const filtered = selectedAuthors.filter((a) => a.author_id !== uid)
    // Re-index author orders
    const reordered = filtered.map((a, idx) => ({ ...a, author_order: idx + 1 }))
    setSelectedAuthors(reordered)
  }

  const handleAddPublicationSubmit = async (e) => {
    e.preventDefault()
    setFormMsg({ type: '', text: '' })

    if (!newTitle.trim()) {
      setFormMsg({ type: 'error', text: 'Publication title is required.' })
      return
    }

    const finalDomain = selectedDomain === '__CUSTOM__' ? customDomain : selectedDomain
    const authorsPayload = selectedAuthors.map((a) => ({
      author_id: a.author_id,
      author_order: a.author_order
    }))

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/publication`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          journal_category: newJournalCategory,
          publication_date: newDate || null,
          link: newLink.trim() || null,
          domain_name: finalDomain,
          authors: authorsPayload
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        setFormMsg({ type: 'success', text: 'Publication added successfully!' })
        setNewTitle('')
        setNewDate('')
        setNewLink('')
        setCustomDomain('')
        setSelectedAuthors([])
        setTimeout(() => {
          setShowAddModal(false)
          setFormMsg({ type: '', text: '' })
          fetchPublications()
          fetchDomains()
        }, 1000)
      } else {
        setFormMsg({ type: 'error', text: data.message || 'Failed to add publication.' })
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: 'Network error: Failed to connect to server.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Academic Research
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">Publications</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Explore research papers, conference proceedings, and journal publications authored by university members.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Publication</span>
        </button>
      </div>

      {/* Navigation Sub-Tabs: All Publications vs My Publications */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('all')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all ${
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
          className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all flex items-center space-x-1.5 ${
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
                placeholder={activeTab === 'my' ? "Search your published papers or domain..." : "Search by publication title or topic domain..."}
                className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-2.5 pl-11 text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
              />
              <svg
                className="w-5 h-5 text-slate-400 absolute left-4 top-3"
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
                  className="absolute right-4 top-3 text-xs text-black hover:text-blue-900 font-bold"
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
              className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-2.5 text-black text-sm font-semibold focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
            >
              <option value="All">All Categories</option>
              <option value="A*">A*</option>
              <option value="A">A</option>
              <option value="B">B</option>
              <option value="C">C</option>
            </select>
          </div>
        </div>
      </div>

      {/* Publications Feed List */}
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
                : 'You have not added any published papers yet. Add your published work to showcase it on your profile!'
              : searchQuery || selectedCategory !== 'All'
                ? 'No publication matched your search or category filter. Try clearing filters.'
                : 'Be the first to add a research paper or publication!'}
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-3 px-4 py-2 bg-sky-100 hover:bg-sky-200 border border-sky-300 text-blue-950 rounded-xl text-xs font-bold transition-all"
          >
            {activeTab === 'my' ? 'Add Publication Now' : 'Add Publication Now'}
          </button>
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
                    <div className="flex items-center space-x-3 text-xs text-slate-600 font-medium">
                      <span>Publication Date: <strong className="text-black font-semibold">{pub.formatted_date || pub.publication_date || 'N/A'}</strong></span>
                      {pub.journal_category && (
                        <span>Category: <strong className="text-blue-950 font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">{pub.journal_category}</strong></span>
                      )}
                    </div>
                  </div>

                  {pub.domain_name && (
                    <span className="shrink-0 bg-sky-100 text-blue-950 border border-sky-200 px-3 py-1 rounded-full text-xs font-bold self-start">
                      {pub.domain_name}
                    </span>
                  )}
                </div>

                {/* Authors List (No Student/Faculty badges per specification, clickable names) */}
                <div className="space-y-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Authors ({pub.authors ? pub.authors.length : 0})
                  </span>
                  {pub.authors && pub.authors.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2">
                      {pub.authors.map((author) => {
                        const targetTab = author.role === 'Faculty' ? 'search_faculties' : 'search_students'
                        return (
                          <div
                            key={`${pub.publication_id}-${author.author_id}-${author.author_order}`}
                            className="flex items-center space-x-1.5 bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-xs"
                          >
                            <span className="font-extrabold text-slate-500 text-[10px]">
                              #{author.author_order}
                            </span>
                            {/* Clickable Author Name (No role badges) */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToSearch && author.name) {
                                  onNavigateToSearch(targetTab, author.name)
                                }
                              }}
                              title={`Click to search for ${author.name} in ${author.role === 'Faculty' ? 'Search Faculties' : 'Search Students'}`}
                              className="font-bold text-blue-900 hover:text-blue-950 hover:underline cursor-pointer transition-all"
                            >
                              {author.name}
                            </button>
                          </div>
                        )
                      })}
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
                      <span>DOI</span>
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

      {/* Add Publication Modal Popup */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 relative animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-blue-950">Add Publication</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Submit a new academic paper, journal, or conference publication.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-black font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {formMsg.text && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold ${
                  formMsg.type === 'success'
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border border-rose-200 text-rose-900'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleAddPublicationSubmit} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  Publication Title *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Federated Learning in Medical Diagnostics"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
                />
              </div>

              {/* Journal Category & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                    Journal Category
                  </label>
                  <select
                    value={newJournalCategory}
                    onChange={(e) => setNewJournalCategory(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
                  >
                    <option value="A*">A*</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                    Publication Date
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
                  />
                </div>
              </div>

              {/* Topic Domain */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  Topic Domain
                </label>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all mb-2"
                >
                  {domainsList.map((dom) => (
                    <option key={dom} value={dom}>
                      {dom}
                    </option>
                  ))}
                  <option value="__CUSTOM__">Add / Type New Custom Domain</option>
                </select>

                {selectedDomain === '__CUSTOM__' && (
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    placeholder="Enter custom domain name"
                    required
                    className="w-full px-4 py-2.5 bg-sky-50 border border-sky-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                )}
              </div>

              {/* DOI / Link */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  DOI or Paper Link URL
                </label>
                <input
                  type="text"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  placeholder="e.g. https://doi.org/10.1000/182 or paper URL"
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
                />
              </div>

              {/* Authors List Selector */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-black">
                  Authors & Author Order
                </label>

                {/* Add Author Controls */}
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedAuthorId}
                    onChange={(e) => setSelectedAuthorId(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-black text-xs font-semibold focus:outline-none focus:border-blue-900"
                  >
                    {allUsersList.map((u) => (
                      <option key={u.uid} value={u.uid}>
                        {u.name} ({u.role}) - {u.email}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddAuthorToModal}
                    className="px-3 py-2 bg-sky-100 hover:bg-sky-200 border border-sky-300 text-blue-950 text-xs font-bold rounded-xl shrink-0 transition-all"
                  >
                    + Add Co-Author
                  </button>
                </div>

                {/* Selected Authors Badges */}
                <div className="space-y-1.5 pt-1">
                  {selectedAuthors.map((a) => (
                    <div
                      key={a.author_id}
                      className="flex items-center justify-between bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-blue-950 text-xs bg-sky-100 border border-sky-200 px-2 py-0.5 rounded-md">
                          #{a.author_order} Author
                        </span>
                        <span className="font-bold text-black">{a.name}</span>
                        <span className="text-[10px] text-slate-500 font-medium">({a.role})</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveAuthorFromModal(a.author_id)}
                        className="text-rose-600 hover:text-rose-800 text-xs font-bold px-1"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Adding...' : 'Add Publication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
