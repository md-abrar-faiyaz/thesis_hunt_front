import { useState, useEffect, useRef } from 'react'
import { API_BASE_URL } from '../../config'

export default function FacultyGroupChannelSection({ user }) {
  const [groups, setGroups] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(null)
  const [channelData, setChannelData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef(null)

  // Fetch faculty's supervised groups list
  useEffect(() => {
    if (!user || !user.uid) return
    fetch(`${API_BASE_URL}/api/faculty/groups/${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.groups && data.groups.length > 0) {
          setGroups(data.groups)
          setSelectedGroupId(data.groups[0].group_id)
        } else {
          setGroups([])
          setLoading(false)
        }
      })
      .catch(() => {
        setError('Failed to fetch supervised groups.')
        setLoading(false)
      })
  }, [user?.uid])

  // Fetch active channel details and chat history
  const fetchChannel = () => {
    if (!user?.uid || !selectedGroupId) return
    fetch(`${API_BASE_URL}/api/faculty/group-channel/${user.uid}/${selectedGroupId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && data.group) {
          setChannelData(data.group)
        } else {
          setError(data.message || 'Failed to load group channel.')
        }
      })
      .catch(() => setError('Failed to connect to chat server.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (selectedGroupId) {
      setLoading(true)
      fetchChannel()
      const timer = setInterval(fetchChannel, 6000)
      return () => clearInterval(timer)
    }
  }, [selectedGroupId, user?.uid])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelData?.messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!messageText.trim() || !selectedGroupId) return
    setSending(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/faculty/group-channel/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sent_by: user.uid,
          posted_in: selectedGroupId,
          content: messageText.trim()
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setMessageText('')
        fetchChannel()
      }
    } catch {
      // Ignore
    } finally {
      setSending(false)
    }
  }

  if (loading && groups.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (groups.length === 0) {
    return (
      <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-sm">
        <h3 className="text-xl font-bold text-slate-800 mb-2">No Group Channel Available</h3>
        <p className="text-xs text-slate-500">
          You are not currently assigned as a supervisor or co-supervisor for any active thesis group.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Group Selector Dropdown */}
      <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs font-bold text-sky-900 uppercase tracking-wider block mb-1">
            Faculty Group Chat Channel
          </span>
          <h2 className="text-2xl font-extrabold text-blue-950">
            {channelData?.title || 'Thesis Group Chat'}
          </h2>
        </div>

        {/* Group Selector Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <label className="text-xs font-bold text-slate-700 uppercase whitespace-nowrap">Select Group:</label>
          <select
            value={selectedGroupId || ''}
            onChange={(e) => setSelectedGroupId(Number(e.target.value))}
            className="w-full sm:w-64 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-900"
          >
            {groups.map((g) => (
              <option key={g.group_id} value={g.group_id}>
                Group #{g.group_id} - {g.title.slice(0, 30)}... ({g.faculty_role})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Chat Container */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Group Details Banner */}
        {channelData && (
          <div className="bg-slate-50 border-b border-slate-200 p-4 px-6 flex justify-between items-center text-xs">
            <div>
              <span className="font-bold text-slate-800">Domain:</span>{' '}
              <span className="text-blue-900 font-semibold">{channelData.domain}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800">Members:</span>
              <div className="flex -space-x-2">
                {channelData.members?.map((m) => (
                  <span
                    key={m.student_id}
                    title={`${m.name} (CGPA: ${m.CGPA})`}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-900 text-white font-bold text-[10px] ring-2 ring-white"
                  >
                    {m.name.charAt(0)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {!channelData?.messages || channelData.messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-slate-400 text-xs font-medium">
              No messages posted in this thesis group channel yet. Be the first to start the conversation!
            </div>
          ) : (
            channelData.messages.map((msg) => {
              const isFacultySelf = msg.sent_by === user.uid
              const isFacultyOther = msg.sender_role === 'Faculty'

              return (
                <div
                  key={msg.message_id}
                  className={`flex flex-col ${isFacultySelf ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold text-slate-800">{msg.sender_name}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        isFacultySelf
                          ? 'bg-blue-900 text-white'
                          : isFacultyOther
                          ? 'bg-indigo-100 text-indigo-900'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {msg.sender_role}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{msg.formatted_time}</span>
                  </div>

                  <div
                    className={`max-w-lg p-4 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                      isFacultySelf
                        ? 'bg-blue-900 text-white rounded-tr-xs'
                        : 'bg-white text-slate-900 border border-slate-200 rounded-tl-xs'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              )
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex gap-3">
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            placeholder="Type your message or thesis announcement to the group..."
            className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl text-sm focus:outline-none focus:border-blue-900"
          />
          <button
            type="submit"
            disabled={sending || !messageText.trim()}
            className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs rounded-2xl transition-all disabled:opacity-50 shadow-xs"
          >
            {sending ? 'Posting...' : 'Send Message'}
          </button>
        </form>
      </div>
    </div>
  )
}
