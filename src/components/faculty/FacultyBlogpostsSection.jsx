import { useState, useEffect, useCallback } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyBlogpostsSection({ user }) {
  const [activeTab, setActiveTab] = useState('all') // 'all' | 'my'
  const [searchQuery, setSearchQuery] = useState('')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Create / Edit Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
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
    if (activeTab === 'my' && user && user.uid) {
      params.append('author_id', user.uid)
    }

    fetch(`${API_BASE_URL}/api/faculty/blogposts?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setPosts(data.posts || [])
        } else {
          setError(data.message || 'Failed to load blog posts.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to blog server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [searchQuery, activeTab, user])

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
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    fetchDomains()
  }, [])

  const handleOpenCreate = () => {
    setEditingPostId(null)
    setTitle('')
    setContent('')
    setCustomDomain('')
    if (domainsList.length > 0) setSelectedDomain(domainsList[0])
    setFormMsg({ type: '', text: '' })
    setShowModal(true)
  }

  const handleOpenEdit = (post) => {
    setEditingPostId(post.post_id)
    setTitle(post.title || '')
    setContent(post.content || '')
    const dom = post.domain_name || ''
    if (domainsList.includes(dom)) {
      setSelectedDomain(dom)
      setCustomDomain('')
    } else if (dom) {
      setSelectedDomain('__CUSTOM__')
      setCustomDomain(dom)
    } else if (domainsList.length > 0) {
      setSelectedDomain(domainsList[0])
      setCustomDomain('')
    }
    setFormMsg({ type: '', text: '' })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) {
      setFormMsg({ type: 'error', text: 'Title and content are required.' })
      return
    }

    const finalDomain = selectedDomain === '__CUSTOM__' ? customDomain.trim() : selectedDomain
    if (!finalDomain) {
      setFormMsg({ type: 'error', text: 'Please select or specify a topic domain.' })
      return
    }

    setSubmitting(true)
    setFormMsg({ type: '', text: '' })

    try {
      if (editingPostId) {
        // Edit post
        const res = await fetch(`${API_BASE_URL}/api/faculty/blogposts/${editingPostId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            posted_by: user.uid,
            title: title.trim(),
            content: content.trim(),
            domain_name: finalDomain
          })
        })
        const data = await res.json()
        if (data.status === 'ok') {
          setFormMsg({ type: 'success', text: 'Blog post updated successfully!' })
          setTimeout(() => {
            setShowModal(false)
            fetchPosts()
          }, 800)
        } else {
          setFormMsg({ type: 'error', text: data.message || 'Failed to update post.' })
        }
      } else {
        // Create new post
        const res = await fetch(`${API_BASE_URL}/api/faculty/blogposts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            posted_by: user.uid,
            title: title.trim(),
            content: content.trim(),
            domain_name: finalDomain
          })
        })
        const data = await res.json()
        if (data.status === 'ok') {
          setFormMsg({ type: 'success', text: 'Research blog post published successfully!' })
          setTimeout(() => {
            setShowModal(false)
            fetchPosts()
          }, 800)
        } else {
          setFormMsg({ type: 'error', text: data.message || 'Failed to publish post.' })
        }
      }
    } catch (err) {
      setFormMsg({ type: 'error', text: 'Network error: Failed to connect to server.' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/faculty/blogposts/${postId}?user_id=${user.uid}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setStatusMsg('Blog post deleted successfully!')
        fetchPosts()
      } else {
        alert(data.message || 'Failed to delete post.')
      }
    } catch {
      alert('Failed to delete post.')
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
          <h2 className="text-3xl font-extrabold text-black mt-2">Faculty Blogposts</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Share and explore academic research findings, insights, and publications with students and faculty.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-5 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
          </svg>
          <span>Create Blogpost</span>
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

      {/* Navigation Sub-Tabs: All Blogposts vs My Blogposts */}
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
          All Blogposts
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
          <span>My Blogposts</span>
        </button>
      </div>

      {/* Search Bar Panel */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
        <label className="block text-xs font-bold text-black uppercase tracking-wider mb-2">
          {activeTab === 'my' ? 'Search My Blogposts' : 'Search Blogposts'}
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'my'
                ? 'Search your blogposts by title or domain'
                : 'Search posts by title, writer name, or topic domain'
            }
            className="w-full bg-white border border-slate-300 rounded-2xl px-4 py-3 pl-11 text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
          />
          <svg
            className="w-5 h-5 text-slate-400 absolute left-4 top-3.5"
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
              className="absolute right-4 top-3.5 text-xs text-black hover:text-blue-900 font-bold cursor-pointer"
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
          <p className="text-lg font-bold text-black">
            {activeTab === 'my' ? 'No Blogposts Created Yet' : 'No Blogposts Found'}
          </p>
          <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
            {activeTab === 'my'
              ? searchQuery
                ? 'No blogposts matching your search criteria were found in your posts.'
                : 'You have not created any blogposts yet. Share your findings or questions with the community!'
              : searchQuery
              ? 'No blogpost matched your search criteria. Try a different keyword.'
              : 'Be the first to publish a research blogpost or discussion topic!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => {
            const isOwner = post.posted_by === user.uid

            return (
              <div
                key={post.post_id}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                {/* Author & Header Info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center font-black text-blue-950 shrink-0 text-sm">
                      {post.writer_initial || (post.writer_name ? post.writer_name.charAt(0).toUpperCase() : 'F')}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-extrabold text-blue-950">
                          {post.writer_name}
                        </h4>
                        <span className="bg-purple-100 text-purple-950 border border-purple-300 font-extrabold px-2 py-0.5 rounded-lg text-[10px] uppercase">
                          {post.writer_role || 'Faculty'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        Posted {post.timestamp_display || post.formatted_date || 'recently'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="bg-sky-50 text-blue-950 border border-sky-200 font-bold px-3 py-1 rounded-full text-xs">
                      {post.domain_name || 'General Science'}
                    </span>

                    {/* Owner Action Controls */}
                    {isOwner && (
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(post)}
                          className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.post_id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <h3 className="text-xl font-extrabold text-black leading-snug">{post.title}</h3>
                  <p className="text-sm text-black font-normal leading-relaxed whitespace-pre-line bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    {post.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* CREATE / EDIT BLOGPOST MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-xl w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-xl font-extrabold text-black">
                  {editingPostId ? 'Edit Research Blogpost' : 'Create Research Blogpost'}
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  {editingPostId ? 'Modify your published research blogpost.' : 'Publish insights, findings, or questions for students and faculty.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-black text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {formMsg.text && (
              <div
                className={`p-3.5 rounded-xl text-xs font-semibold ${
                  formMsg.type === 'error'
                    ? 'bg-rose-50 border border-rose-200 text-rose-900'
                    : 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                }`}
              >
                {formMsg.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Title <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advances in Deep Reinforcement Learning for Autonomous Systems"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black text-sm focus:outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Topic Research Domain <span className="text-rose-600">*</span>
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
                    placeholder="e.g. Quantum Computing Architecture"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-black text-sm focus:outline-none focus:border-blue-900"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                  Content / Article Body <span className="text-rose-600">*</span>
                </label>
                <textarea
                  rows="6"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your research article content, questions, or findings here..."
                  className="w-full bg-white border border-slate-300 rounded-xl p-3.5 text-black text-sm focus:outline-none focus:border-blue-900 leading-relaxed"
                  required
                ></textarea>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title.trim() || !content.trim()}
                  className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50 shadow-sm cursor-pointer"
                >
                  {submitting ? 'Submitting...' : editingPostId ? 'Save Edits' : 'Publish Blogpost'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
