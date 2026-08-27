import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function BlogpostsSection({ user, onNavigateToSearch }) {

  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Create Post Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [domainsList, setDomainsList] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [formMsg, setFormMsg] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)

  const fetchPosts = useCallback(() => {
    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    if (searchQuery.trim()) {
      params.append('q', searchQuery.trim())
    }

    fetch(`${API_BASE_URL}/api/student/blogposts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setPosts(data.posts || [])
        } else {
          setError(data.message || 'Failed to load blog posts.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to backend server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchQuery])

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
            'Software Engineering',
            'Cybersecurity & Cryptography'
          ]
          setDomainsList(fallback)
          if (!selectedDomain) setSelectedDomain(fallback[0])
        }
      })
      .catch(() => {
        const fallback = ['Artificial Intelligence & Machine Learning', 'Software Engineering']
        setDomainsList(fallback)
        if (!selectedDomain) setSelectedDomain(fallback[0])
      })
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPosts()
    }, 250)
    return () => clearTimeout(timer)
  }, [fetchPosts])

  useEffect(() => {
    fetchDomains()
  }, [])

  const handleCreatePost = async (e) => {
    e.preventDefault()
    setFormMsg({ type: '', text: '' })

    if (!user || !user.uid) {
      setFormMsg({ type: 'error', text: 'You must be logged in to create a post.' })
      return
    }

    const finalDomain = selectedDomain === '__CUSTOM__' ? customDomain : selectedDomain

    setSubmitting(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/blogpost`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          posted_by: user.uid,
          domain_name: finalDomain
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        setFormMsg({ type: 'success', text: 'Post published successfully!' })
        setNewTitle('')
        setNewContent('')
        setCustomDomain('')
        setTimeout(() => {
          setShowCreateModal(false)
          setFormMsg({ type: '', text: '' })
          fetchPosts()
          fetchDomains()
        }, 1000)
      } else {
        setFormMsg({ type: 'error', text: data.message || 'Failed to publish post.' })
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
            Social Research Feed
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">Thesis Blogposts</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Explore academic discussions, research updates, and insights posted by students and faculty.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Blogpost</span>
        </button>
      </div>

      {/* Search Bar Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
          Search Blogposts
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts by title, writer name, or topic domain..."
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

      {/* Blog Feed Results */}
      {error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl text-sm font-semibold">
          {error}
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
          <p className="text-lg font-bold text-black">No Blogposts Found</p>
          <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
            {searchQuery
              ? 'No blogpost matched your search criteria. Try a different keyword.'
              : 'Be the first to publish a research blogpost or discussion topic!'}
          </p>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="mt-3 px-4 py-2 bg-sky-100 hover:bg-sky-200 border border-sky-300 text-blue-950 rounded-xl text-xs font-bold transition-all"
          >
            Write Post Now
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {posts.map((post) => {
            const isFaculty = post.writer_role === 'Faculty'
            return (
              <article
                key={post.post_id}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition-all space-y-4"
              >
                {/* Header: Clickable Writer Name, Role Badge on Right & Date */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      {/* Clickable Writer Name */}
                      <button
                        type="button"
                        onClick={() => {
                          const targetTab = isFaculty ? 'search_faculties' : 'search_students'
                          if (onNavigateToSearch && post.writer_name) {
                            onNavigateToSearch(targetTab, post.writer_name)
                          }
                        }}
                        title={`Click to search for ${post.writer_name} in ${isFaculty ? 'Search Faculties' : 'Search Students'}`}
                        className="text-sm font-bold text-blue-900 hover:text-blue-950 hover:underline text-left leading-snug cursor-pointer transition-all inline-block"
                      >
                        {post.writer_name || 'Anonymous Writer'}
                      </button>

                      {/* Role Badge on the right side of writer's name */}
                      {isFaculty ? (
                        <span className="bg-purple-100 text-purple-950 border border-purple-300 font-extrabold px-2 py-0.5 rounded-lg text-[10px] tracking-wider uppercase shrink-0">
                          Faculty
                        </span>
                      ) : (
                        <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 font-extrabold px-2 py-0.5 rounded-lg text-[10px] tracking-wider uppercase shrink-0">
                          Student
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-600 font-medium mt-0.5">
                      {post.formatted_date || 'Date not specified'}
                    </p>
                  </div>

                  {post.topic_domain && (
                    <span className="shrink-0 bg-sky-100 text-blue-950 border border-sky-200 px-3 py-1 rounded-full text-xs font-bold">
                      {post.topic_domain}
                    </span>
                  )}
                </div>

                {/* Post Title */}
                <h3 className="text-xl font-extrabold text-blue-950 leading-snug">
                  {post.title}
                </h3>

                {/* Post Content Body */}
                <div className="text-sm text-black font-medium leading-relaxed whitespace-pre-line border-t border-slate-100 pt-3">
                  {post.content}
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* Create Blogpost Modal Popup */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 space-y-5 relative animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-blue-950">Create New Blogpost</h3>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Share research topics, findings, or thesis updates with the community.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
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

            <form onSubmit={handleCreatePost} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  Post Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Deep Learning Approaches for Medical Imaging"
                  required
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
                />
              </div>

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
                    placeholder="Enter custom topic domain name"
                    required
                    className="w-full px-4 py-2.5 bg-sky-50 border border-sky-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
                  Post Content (Writing)
                </label>
                <textarea
                  rows="6"
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Write your research post content here..."
                  required
                  className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
