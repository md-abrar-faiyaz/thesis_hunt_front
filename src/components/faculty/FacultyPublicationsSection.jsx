import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyPublicationsSection({ user }) {
  const [publications, setPublications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Search & Filter State
  const [searchTitle, setSearchTitle] = useState('')
  const [searchCategory, setSearchCategory] = useState('')
  const [searchDomain, setSearchDomain] = useState('')
  const [sortOrder, setSortOrder] = useState('desc') // 'desc' or 'asc'

  // Publish Modal State
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Journal (Q1)')
  const [pubDate, setPubDate] = useState('')
  const [paperLink, setPaperLink] = useState('')
  const [domainName, setDomainName] = useState('')
  const [publishing, setPublishing] = useState(false)

  const fetchPublications = () => {
    setLoading(true)
    let url = `${API_BASE_URL}/api/faculty/publications?`
    const params = new URLSearchParams()
    if (searchTitle.trim()) params.append('q', searchTitle.trim())
    if (searchCategory.trim()) params.append('journal_category', searchCategory.trim())
    if (searchDomain.trim()) params.append('domain', searchDomain.trim())
    params.append('sort_by_date', sortOrder)

    fetch(url + params.toString())
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setPublications(data.publications || [])
        } else {
          setError(data.message || 'Failed to fetch publications.')
        }
      })
      .catch(() => setError('Failed to connect to publications server.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPublications()
  }, [searchTitle, searchCategory, searchDomain, sortOrder])

  const handlePublishPaper = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setPublishing(true)
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
          domain_name: domainName.trim() || null,
          authors: [
            { author_id: user.uid, author_order: 1 }
          ]
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setStatusMsg('Publication added successfully!')
        setShowPublishModal(false)
        setTitle('')
        setPaperLink('')
        fetchPublications()
      } else {
        setStatusMsg(data.message || 'Failed to add publication.')
      }
    } catch {
      setStatusMsg('Failed to add publication.')
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header & Publish Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-950">Academic Publications</h2>
          <p className="text-slate-500 text-xs mt-1">
            Browse published journal papers, conference proceedings, and research literature
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPublishModal(true)}
          className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
        >
          + Publish New Paper
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 p-4 rounded-2xl text-xs font-semibold flex justify-between items-center">
          <span>{statusMsg}</span>
          <button type="button" onClick={() => setStatusMsg('')} className="text-emerald-900 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Search & Sort Controls */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Search Title</label>
          <input
            type="text"
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            placeholder="Search title..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Journal Category</label>
          <input
            type="text"
            value={searchCategory}
            onChange={(e) => setSearchCategory(e.target.value)}
            placeholder="e.g. Q1, IEEE, ACM"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Domain</label>
          <input
            type="text"
            value={searchDomain}
            onChange={(e) => setSearchDomain(e.target.value)}
            placeholder="e.g. Computer Vision"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Sort By Date</label>
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-blue-900"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Publications Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-2xl text-center">
          {error}
        </div>
      ) : publications.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs font-medium">
          No publications match your search criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {publications.map((pub) => (
            <div
              key={pub.publication_id}
              className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-sky-100 text-sky-950 font-bold rounded-full text-xs">
                    {pub.journal_category || 'Research Paper'}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    {pub.formatted_date || pub.publication_date || 'Date N/A'}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-900 text-base leading-snug">{pub.title}</h3>
                  <p className="text-xs font-semibold text-blue-900 mt-1">Domain: {pub.domain_name}</p>
                </div>

                {/* Authors Roster */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Authors</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {pub.authors?.map((a) => (
                      <span
                        key={a.author_id}
                        className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-slate-800 rounded-lg text-xs font-semibold"
                      >
                        {a.author_name} ({a.role})
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {pub.link ? (
                <a
                  href={pub.link}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full text-center py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all block"
                >
                  Read / View Paper Link ↗
                </a>
              ) : (
                <div className="w-full text-center py-2.5 bg-slate-100 text-slate-400 font-bold text-xs rounded-xl">
                  No External Link Provided
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* PUBLISH NEW PAPER MODAL */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handlePublishPaper}
            className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Publish Research Paper</h3>
                <p className="text-xs text-slate-500">Add publication metadata to database repository</p>
              </div>
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Paper Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Graph Neural Networks for Database Query Optimization"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Journal Category / Venue</label>
                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. IEEE Transactions on Knowledge Data Eng (Q1)"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Publication Date</label>
                <input
                  type="date"
                  value={pubDate}
                  onChange={(e) => setPubDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Paper Link / DOI URL</label>
                <input
                  type="url"
                  value={paperLink}
                  onChange={(e) => setPaperLink(e.target.value)}
                  placeholder="https://doi.org/10.1109/..."
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Research Domain</label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="e.g. Database Systems"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={publishing}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Confirm Publication'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
