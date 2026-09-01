import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyBlogpostsSection({ user }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusMsg, setStatusMsg] = useState('')

  // Search Filters
  const [searchTitle, setSearchTitle] = useState('')
  const [searchWriter, setSearchWriter] = useState('')
  const [searchDomain, setSearchDomain] = useState('')

  // Post / Edit Modal state
  const [showModal, setShowModal] = useState(false)
  const [editingPostId, setEditingPostId] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [domainName, setDomainName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchPosts = () => {
    setLoading(true)
    let url = `${API_BASE_URL}/api/faculty/blogposts?`
    const params = new URLSearchParams()
    if (searchTitle.trim()) params.append('q', searchTitle.trim())
    if (searchWriter.trim()) params.append('writer_name', searchWriter.trim())
    if (searchDomain.trim()) params.append('domain', searchDomain.trim())

    fetch(url + params.toString())
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setPosts(data.posts || [])
        } else {
          setError(data.message || 'Failed to fetch blogposts.')
        }
      })
      .catch(() => setError('Failed to connect to blog server.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchPosts()
  }, [searchTitle, searchWriter, searchDomain])

  const handleOpenCreate = () => {
    setEditingPostId(null)
    setTitle('')
    setContent('')
    setDomainName('')
    setShowModal(true)
  }

  const handleOpenEdit = (post) => {
    setEditingPostId(post.post_id)
    setTitle(post.title)
    setContent(post.content)
    setDomainName(post.domain_name)
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !content.trim()) return
    setSubmitting(true)
    setStatusMsg('')

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
            domain_name: domainName.trim()
          })
        })
        const data = await res.json()
        if (data.status === 'ok') {
          setStatusMsg('Blog post updated successfully!')
          setShowModal(false)
          fetchPosts()
        } else {
          setStatusMsg(data.message || 'Failed to update post.')
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
            domain_name: domainName.trim()
          })
        })
        const data = await res.json()
        if (data.status === 'ok') {
          setStatusMsg('Research blog post published successfully!')
          setShowModal(false)
          fetchPosts()
        } else {
          setStatusMsg(data.message || 'Failed to publish post.')
        }
      }
    } catch {
      setStatusMsg('Failed to process blog post.')
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
        setStatusMsg(data.message || 'Failed to delete post.')
      }
    } catch {
      setStatusMsg('Failed to delete post.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Banner & Post Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-2xl font-extrabold text-blue-950">Faculty Research Blogs</h2>
          <p className="text-slate-500 text-xs mt-1">
            Share and explore academic research findings, insights, and publications
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
        >
          + Create Blog Post
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

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Search by Title</label>
          <input
            type="text"
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
            placeholder="Search keywords..."
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Search by Writer Name</label>
          <input
            type="text"
            value={searchWriter}
            onChange={(e) => setSearchWriter(e.target.value)}
            placeholder="e.g. Dr. Alan Turing"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-900"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">Search by Domain</label>
          <input
            type="text"
            value={searchDomain}
            onChange={(e) => setSearchDomain(e.target.value)}
            placeholder="e.g. Machine Learning"
            className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-blue-900"
          />
        </div>
      </div>

      {/* Posts Social Feed */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-2xl text-center">
          {error}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-400 text-xs font-medium">
          No research blog posts match your search criteria.
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => {
            const isOwner = post.posted_by === user.uid

            return (
              <div
                key={post.post_id}
                className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4 transition-all hover:border-slate-300"
              >
                {/* Author & Header Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-950 text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                      {post.writer_initial || post.writer_name?.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                        {post.writer_name}
                        <span className="px-2 py-0.5 bg-sky-100 text-sky-950 font-bold text-[10px] rounded-md uppercase">
                          {post.writer_role}
                        </span>
                      </h3>
                      <span className="text-[11px] text-slate-400 font-medium">
                        Posted {post.timestamp_display} • {post.formatted_date}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="px-3 py-1 bg-slate-100 text-blue-950 font-bold rounded-full text-xs border border-slate-200">
                      {post.domain_name}
                    </span>

                    {/* Edit / Delete Options for Author */}
                    {isOwner && (
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(post)}
                          className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs rounded-xl"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(post.post_id)}
                          className="px-3 py-1 bg-rose-100 hover:bg-rose-200 text-rose-900 font-bold text-xs rounded-xl"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-xl font-extrabold text-slate-900 leading-snug">{post.title}</h4>
                  <p className="text-slate-700 text-xs sm:text-sm mt-3 leading-relaxed whitespace-pre-line bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                    {post.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* POST / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl"
          >
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">
                  {editingPostId ? 'Edit Research Blog Post' : 'Create New Blog Post'}
                </h3>
                <p className="text-xs text-slate-500">Publish research insights and findings</p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xl"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Blog Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Advances in Deep Reinforcement Learning for Autonomous Systems"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Topic Domain</label>
                <input
                  type="text"
                  value={domainName}
                  onChange={(e) => setDomainName(e.target.value)}
                  placeholder="e.g. Artificial Intelligence"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Content / Writing</label>
                <textarea
                  rows="6"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your research article content here..."
                  className="w-full p-4 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-blue-900 leading-relaxed"
                  required
                ></textarea>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-50"
              >
                {submitting ? 'Publishing...' : editingPostId ? 'Save Blog Edit' : 'Publish Blog Post'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
