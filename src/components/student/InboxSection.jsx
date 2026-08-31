import { useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE_URL } from '../../config'

export default function InboxSection({ user, initialTargetPartner }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedPartner, setSelectedPartner] = useState(null)
  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [messagesError, setMessagesError] = useState('')

  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch list of conversation cards
  const fetchConversations = useCallback(() => {
    if (!user || !user.uid) return

    setLoading(true)
    setError('')

    fetch(`${API_BASE_URL}/api/student/inbox/conversations?user_id=${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setConversations(data.conversations || [])
        } else {
          setError(data.message || 'Failed to load inbox conversations.')
        }
      })
      .catch(() => {
        setError('Network error: Unable to connect to backend server.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [user])

  // Fetch full conversation message history with selected partner
  const fetchMessages = useCallback(
    (partnerId, silent = false) => {
      if (!user || !user.uid || !partnerId) return

      if (!silent) {
        setMessagesLoading(true)
        setMessagesError('')
      }

      fetch(`${API_BASE_URL}/api/student/inbox/messages?user_id=${user.uid}&partner_id=${partnerId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'ok') {
            setMessages(data.messages || [])
            if (data.partner) {
              setSelectedPartner(data.partner)
            }
          } else {
            if (!silent) setMessagesError(data.message || 'Failed to load conversation messages.')
          }
        })
        .catch(() => {
          if (!silent) setMessagesError('Network error: Failed to connect to server.')
        })
        .finally(() => {
          if (!silent) setMessagesLoading(false)
        })
    },
    [user]
  )

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    if (initialTargetPartner && initialTargetPartner.partner_id) {
      setSelectedPartner({
        partner_id: initialTargetPartner.partner_id,
        partner_name: initialTargetPartner.partner_name,
        partner_role: initialTargetPartner.partner_role
      })
      fetchMessages(initialTargetPartner.partner_id)
    }
  }, [initialTargetPartner, fetchMessages])

  useEffect(() => {
    if (selectedPartner) {
      scrollToBottom()
    }
  }, [messages, selectedPartner])

  const handleOpenConversation = (conv) => {
    setSelectedPartner({
      partner_id: conv.partner_id,
      partner_name: conv.partner_name,
      partner_role: conv.partner_role,
      partner_email: conv.partner_email
    })
    fetchMessages(conv.partner_id)
  }

  const handleBackToInbox = () => {
    setSelectedPartner(null)
    setMessages([])
    fetchConversations()
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    const textToSend = newMessage.trim()
    if (!textToSend || !user || !user.uid || !selectedPartner) return

    // Optimistic UI: append temporary message immediately
    const tempId = 'temp_' + Date.now()
    const tempMsg = {
      temp_id: tempId,
      sender_id: user.uid,
      receiver_id: selectedPartner.partner_id,
      message_text: textToSend,
      status: 'Unread',
      isSending: true,
      formatted_time: null
    }

    setMessages((prev) => [...prev, tempMsg])
    setNewMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/student/inbox/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_id: user.uid,
          receiver_id: selectedPartner.partner_id,
          message_text: textToSend
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        fetchMessages(selectedPartner.partner_id, true)
      } else {
        alert(data.message || 'Failed to send message.')
        setMessages((prev) => prev.filter((m) => m.temp_id !== tempId))
      }
    } catch (err) {
      alert('Network error: Failed to connect to server.')
      setMessages((prev) => prev.filter((m) => m.temp_id !== tempId))
    }
  }

  const handleDeleteMessage = async (msg) => {
    if (!user || !user.uid) return

    try {
      const params = new URLSearchParams({
        sender_id: msg.sender_id,
        receiver_id: msg.receiver_id,
        timestamp: msg.timestamp
      })

      const res = await fetch(`${API_BASE_URL}/api/student/inbox/message?${params.toString()}`, {
        method: 'DELETE'
      })

      const data = await res.json()
      if (data.status === 'ok') {
        fetchMessages(selectedPartner.partner_id)
      } else {
        alert(data.message || 'Failed to delete message.')
      }
    } catch (err) {
      alert('Network error: Failed to delete message.')
    }
  }

  const handleInviteResponse = async (msg, groupId, action) => {
    if (!user || !user.uid || !selectedPartner) return

    try {
      const res = await fetch(`${API_BASE_URL}/api/student/group-channel/invitation-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.uid,
          sender_id: msg.sender_id,
          group_id: groupId,
          action: action,
          timestamp: msg.timestamp
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        fetchMessages(selectedPartner.partner_id)
      } else {
        alert(data.message || 'Failed to process invitation response.')
      }
    } catch (err) {
      alert('Network error: Failed to respond to invitation.')
    }
  }

  return (
    <div className="max-w-4xl mx-auto w-full space-y-6">
      {/* Header Banner */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
            Direct Messaging & Notifications
          </span>
          <h2 className="text-3xl font-extrabold text-black mt-2">Inbox</h2>
          <p className="text-sm text-black mt-1 font-medium">
            Manage 1-on-1 academic conversations, project discussions, and system task notifications.
          </p>
        </div>
      </div>

      {/* Main View Mode: Cards View vs Conversation View */}
      {!selectedPartner ? (
        /* Conversation Cards List View */
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-bold uppercase tracking-wider text-black">
              All Conversations ({conversations.length})
            </h3>
          </div>

          {error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 p-5 rounded-2xl text-sm font-semibold">
              {error}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-3 shadow-sm">
              <p className="text-lg font-bold text-black">No Inbox Conversations Yet</p>
              <p className="text-xs text-slate-600 font-medium max-w-md mx-auto">
                You haven't exchanged messages with anyone yet. Go to <strong>Search Students</strong> to send a direct message to a student!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {conversations.map((conv) => {
                const isFaculty = conv.partner_role === 'Faculty'
                const hasUnread = conv.unread_count > 0
                return (
                  <div
                    key={conv.partner_id}
                    onClick={() => handleOpenConversation(conv)}
                    className={`bg-white border rounded-3xl p-5 shadow-xs hover:shadow-md hover:border-blue-900 transition-all cursor-pointer flex items-center justify-between gap-4 ${
                      hasUnread ? 'border-sky-400 bg-sky-50/30' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      {/* User Avatar Circle */}
                      <div className="w-12 h-12 rounded-2xl bg-sky-100 border border-sky-200 flex items-center justify-center font-black text-blue-950 shrink-0 text-base">
                        {conv.partner_name ? conv.partner_name.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-base font-extrabold text-blue-950 truncate">
                            {conv.partner_name}
                          </h4>
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

                        <p className="text-xs text-slate-600 font-medium truncate">
                          {conv.formatted_last_timestamp || 'Recent message'}
                        </p>
                      </div>
                    </div>

                    {/* Unread Badge Counter */}
                    {hasUnread && (
                      <div className="bg-blue-900 text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-sm shrink-0 flex items-center space-x-1">
                        <span>{conv.unread_count}</span>
                        <span className="text-[10px] font-normal uppercase">New</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Single Conversation View */
        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[600px]">
          {/* Conversation Header Bar */}
          <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={handleBackToInbox}
                className="p-2 text-slate-500 hover:text-black hover:bg-slate-200 rounded-xl transition-all"
                title="Back to inbox"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center font-bold text-blue-950 shrink-0 text-sm">
                {selectedPartner.partner_name ? selectedPartner.partner_name.charAt(0).toUpperCase() : 'U'}
              </div>

              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-extrabold text-blue-950">
                    {selectedPartner.partner_name}
                  </h3>
                  {selectedPartner.partner_role === 'Faculty' ? (
                    <span className="bg-purple-100 text-purple-950 border border-purple-300 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                      Faculty
                    </span>
                  ) : (
                    <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold px-2 py-0.5 rounded-lg text-[10px]">
                      Student
                    </span>
                  )}
                </div>
                {selectedPartner.partner_email && (
                  <p className="text-xs text-slate-700">{selectedPartner.partner_email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Messages Feed Container (Ascending Chronological Order) */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
              </div>
            ) : messagesError ? (
              <div className="bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl text-xs font-semibold">
                {messagesError}
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-16 text-slate-600 text-xs font-medium space-y-2">
                <p className="font-bold text-sm text-black">No messages exchanged yet.</p>
                <p>Send a message below to start the conversation!</p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender_id === user.uid
                const isGroupInvite = msg.message_text.startsWith('[Group Invitation:')
                const isNotification =
                  !isGroupInvite &&
                  (msg.message_text.startsWith('[Notification]') ||
                    msg.message_text.startsWith('[Task Notification]') ||
                    msg.message_text.includes('Task'))

                if (isGroupInvite) {
                  // Parse group ID from [Group Invitation:group_id]
                  const match = msg.message_text.match(/^\[Group Invitation:(\d+)\]\s*(.*)$/)
                  const groupId = match ? parseInt(match[1], 10) : null
                  const cleanText = match ? match[2] : msg.message_text

                  const isAccepted = msg.message_text.includes('[ACCEPTED]')
                  const isRejected = msg.message_text.includes('[REJECTED]')
                  const isAnswered = isAccepted || isRejected

                  return (
                    <div
                      key={index}
                      className="max-w-xl mx-auto my-3 bg-sky-50 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="p-2.5 bg-sky-100 rounded-xl text-blue-950 shrink-0">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                            </svg>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950 bg-sky-200/70 px-2 py-0.5 rounded-md">
                                Thesis Group Invitation
                              </span>
                              {isAccepted && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-950 bg-emerald-100 border border-emerald-300 px-2 py-0.5 rounded-md">
                                  Accepted ✓
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-950 bg-rose-100 border border-rose-300 px-2 py-0.5 rounded-md">
                                  Rejected ✕
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-black font-extrabold leading-relaxed mt-1">
                              {cleanText.replace(/\s*\[ACCEPTED\]/, '').replace(/\s*\[REJECTED\]/, '')}
                            </p>
                            <p className="text-[10px] text-slate-600 font-medium">{msg.formatted_time}</p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg)}
                          title="Delete message"
                          className="text-slate-400 hover:text-rose-800 p-1 rounded-lg hover:bg-sky-100 transition-colors shrink-0"
                        >
                          ✕
                        </button>
                      </div>

                      {/* Action Buttons: Accept / Reject (only shown to recipient when pending) */}
                      {!isMe && !isAnswered && groupId && (
                        <div className="flex items-center space-x-3 pt-2 border-t border-sky-100">
                          <button
                            type="button"
                            onClick={() => handleInviteResponse(msg, groupId, 'accept')}
                            className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl transition-all shadow-xs"
                          >
                            Accept Invitation
                          </button>
                          <button
                            type="button"
                            onClick={() => handleInviteResponse(msg, groupId, 'reject')}
                            className="flex-1 py-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-900 font-extrabold text-xs rounded-xl transition-all shadow-xs"
                          >
                            Reject Invitation
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }

                if (isNotification) {
                  return (
                    <div
                      key={index}
                      className="max-w-xl mx-auto my-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 shadow-xs relative group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <div className="p-2 bg-amber-100 rounded-xl text-amber-900 shrink-0">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded-md">
                              System Notification
                            </span>
                            <p className="text-xs text-black font-semibold mt-1.5 leading-relaxed">
                              {msg.message_text}
                            </p>
                            <p className="text-[10px] text-slate-700 font-medium mt-1">
                              {msg.formatted_time}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(msg)}
                          title="Delete notification"
                          className="text-slate-400 hover:text-rose-800 p-1 rounded-lg hover:bg-amber-100 transition-colors shrink-0"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={msg.temp_id || index}
                    className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Small Loading Icon on Left of Sent Message Bubble when Sending */}
                    {isMe && msg.isSending && (
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-blue-900 mb-2.5 shrink-0"></div>
                    )}

                    <div
                      className={`max-w-md rounded-2xl p-4 shadow-xs relative group ${
                        isMe
                          ? 'bg-blue-900 text-white rounded-br-none'
                          : 'bg-white border border-slate-200 text-black rounded-bl-none'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs font-semibold leading-relaxed whitespace-pre-line">
                            {msg.message_text}
                          </p>
                          {msg.formatted_time && !msg.isSending && (
                            <p
                              className={`text-[10px] font-medium ${
                                isMe ? 'text-blue-200' : 'text-slate-700'
                              }`}
                            >
                              {msg.formatted_time}
                            </p>
                          )}
                        </div>

                        {!msg.isSending && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(msg)}
                            title="Delete message"
                            className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-xs rounded ${
                              isMe
                                ? 'text-blue-300 hover:text-white hover:bg-blue-800'
                                : 'text-slate-400 hover:text-rose-800 hover:bg-slate-100'
                            }`}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Send Message Form Footer */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Write a message to ${selectedPartner.partner_name}...`}
              required
              className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-2xl text-black text-xs sm:text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="px-6 py-3 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md disabled:opacity-50 shrink-0"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
