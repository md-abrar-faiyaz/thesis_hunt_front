import { useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE_URL } from '../../config'

const PREDEFINED_SLOTS = [
  '08:00 AM - 09:30 AM',
  '09:30 AM - 11:00 AM',
  '11:00 AM - 12:30 PM',
  '12:30 PM - 02:00 PM',
  '02:00 PM - 03:30 PM',
  '03:30 PM - 05:00 PM',
  '05:00 PM - 06:30 PM'
]

export default function GroupChannelSection({ user, onNavigateToThesisGroups }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [groupData, setGroupData] = useState(null)

  // Chat message form states
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef(null)

  // Create Group Modal states
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createDescription, setCreateDescription] = useState('')
  const [dbDomains, setDbDomains] = useState([])
  const [selectedDomain, setSelectedDomain] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Toggle status state
  const [togglingStatus, setTogglingStatus] = useState(false)

  // Channel Meeting Request Modal States
  const [showChannelMeetingModal, setShowChannelMeetingModal] = useState(false)
  const [selectedSupId, setSelectedSupId] = useState('')
  const [channelMeetingDate, setChannelMeetingDate] = useState('')
  const [channelMeetingSlot, setChannelMeetingSlot] = useState(PREDEFINED_SLOTS[0])
  const [channelLinkOrRoom, setChannelLinkOrRoom] = useState('')
  const [channelMeetingError, setChannelMeetingError] = useState('')
  const [submittingChannelMeeting, setSubmittingChannelMeeting] = useState(false)

  // Edit Thesis Info Modal States
  const [showEditThesisModal, setShowEditThesisModal] = useState(false)
  const [editTitle, setEditTitle] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [selectedEditDomain, setSelectedEditDomain] = useState('')
  const [customEditDomain, setCustomEditDomain] = useState('')
  const [updatingThesis, setUpdatingThesis] = useState(false)
  const [editThesisError, setEditThesisError] = useState('')

  const handleOpenEditThesisModal = () => {
    setEditThesisError('')
    if (groupData?.group_info) {
      setEditTitle(groupData.group_info.title || '')
      setEditDescription(groupData.group_info.description || '')
      const currentDom = groupData.group_info.domain || ''
      const match = dbDomains.find((d) => d.domain_name === currentDom)
      if (match) {
        setSelectedEditDomain(match.domain_name)
        setCustomEditDomain('')
      } else if (currentDom) {
        setSelectedEditDomain('__custom__')
        setCustomEditDomain(currentDom)
      } else if (dbDomains.length > 0) {
        setSelectedEditDomain(dbDomains[0].domain_name)
        setCustomEditDomain('')
      }
    }
    setShowEditThesisModal(true)
  }

  const handleUpdateThesisInfo = async (e) => {
    e.preventDefault()
    setEditThesisError('')
    if (!editTitle.trim()) {
      setEditThesisError('Thesis title is required.')
      return
    }

    const finalDomain = selectedEditDomain === '__custom__' ? customEditDomain : selectedEditDomain
    try {
      setUpdatingThesis(true)
      const res = await fetch(`${API_BASE_URL}/api/student/group-channel/${groupData.group_info.group_id}/thesis`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.uid,
          title: editTitle,
          description: editDescription,
          domain_name: finalDomain
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setShowEditThesisModal(false)
        fetchGroupChannel()
      } else {
        setEditThesisError(data.message || 'Failed to update thesis info.')
      }
    } catch (err) {
      setEditThesisError('Network error: Failed to update thesis info.')
    } finally {
      setUpdatingThesis(false)
    }
  }

  const handleOpenChannelMeetingModal = () => {
    setChannelMeetingError('')
    const sups = groupData?.group_info?.supervisors || []
    if (sups.length > 0) {
      setSelectedSupId(sups[0].supervisor_id)
    }
    setShowChannelMeetingModal(true)
  }

  const handleRequestChannelMeeting = async (e) => {
    e.preventDefault()
    setChannelMeetingError('')
    if (!selectedSupId || !channelMeetingDate || !channelMeetingSlot) {
      setChannelMeetingError('Please fill out date and time slot.')
      return
    }

    try {
      setSubmittingChannelMeeting(true)
      const res = await fetch(`${API_BASE_URL}/api/student/meeting/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.uid,
          group_id: groupData.group_info.group_id,
          host_id: parseInt(selectedSupId),
          date: channelMeetingDate,
          slot: channelMeetingSlot
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        setShowChannelMeetingModal(false)
        setChannelMeetingDate('')
        alert('Meeting request submitted successfully!')
      } else {
        setChannelMeetingError(data.message || 'Failed to request meeting.')
      }
    } catch (err) {
      setChannelMeetingError('Network error requesting meeting.')
    } finally {
      setSubmittingChannelMeeting(false)
    }
  }

  // Fetch available domains from database
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/domains`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok' && Array.isArray(data.domains)) {
          setDbDomains(data.domains)
          if (data.domains.length > 0) {
            setSelectedDomain(data.domains[0].domain_name)
          }
        }
      })
      .catch(() => {})
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Fetch Group Channel details and messages
  const fetchGroupChannel = useCallback((silent = false) => {
    if (!user || !user.uid) return

    if (!silent) {
      setLoading(true)
      setError('')
    }

    fetch(`${API_BASE_URL}/api/student/group-channel/${user.uid}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setGroupData(data)
        } else {
          if (!silent) setError(data.message || 'Failed to load thesis group channel.')
        }
      })
      .catch(() => {
        if (!silent) setError('Network error: Unable to connect to server.')
      })
      .finally(() => {
        if (!silent) setLoading(false)
      })
  }, [user])

  useEffect(() => {
    fetchGroupChannel()
  }, [fetchGroupChannel])

  useEffect(() => {
    if (groupData && groupData.messages) {
      scrollToBottom()
    }
  }, [groupData])

  // Handle Thesis Group Creation
  const handleCreateGroup = async (e) => {
    e.preventDefault()
    if (!createTitle.trim() || !user || !user.uid) return

    const finalDomain = selectedDomain === '__custom__' ? customDomain.trim() : selectedDomain
    if (!finalDomain) {
      setCreateError('Please select or enter a research domain.')
      return
    }

    setCreating(true)
    setCreateError('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/student/group-channel/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: user.uid,
          title: createTitle.trim(),
          description: createDescription.trim(),
          domain_name: finalDomain
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        setShowCreateModal(false)
        setCreateTitle('')
        setCreateDescription('')
        setCustomDomain('')
        fetchGroupChannel()
      } else {
        setCreateError(data.message || 'Failed to create thesis group.')
      }
    } catch (err) {
      setCreateError('Network error: Failed to connect to server.')
    } finally {
      setCreating(false)
    }
  }

  // Handle Toggle Formation Status (Forming <-> Pending)
  const handleToggleStatus = async (action) => {
    if (!groupData || !groupData.group_info || !user || !user.uid) return

    setTogglingStatus(true)
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/student/group-channel/${groupData.group_info.group_id}/toggle-status`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            student_id: user.uid,
            action: action
          })
        }
      )

      const data = await res.json()
      if (data.status === 'ok') {
        fetchGroupChannel()
      } else {
        alert(data.message || 'Failed to update formation status.')
      }
    } catch (err) {
      alert('Network error: Failed to connect to server.')
    } finally {
      setTogglingStatus(false)
    }
  }

  // Handle Send Chat Message
  const handleSendMessage = async (e) => {
    e.preventDefault()
    const textToSend = newMessage.trim()
    if (!textToSend || !user || !user.uid || !groupData || !groupData.group_info) return

    const tempId = 'temp_' + Date.now()
    const tempMsg = {
      message_id: tempId,
      content: textToSend,
      sent_by: user.uid,
      sender_name: user.name || 'You',
      sender_role: 'Student',
      isSending: true,
      formatted_time: null
    }

    // Instantly append optimistic message to groupData messages list
    setGroupData((prev) => ({
      ...prev,
      messages: [...(prev?.messages || []), tempMsg]
    }))
    setNewMessage('')

    try {
      const res = await fetch(`${API_BASE_URL}/api/student/group-channel/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sent_by: user.uid,
          posted_in: groupData.group_info.group_id,
          content: textToSend
        })
      })

      const data = await res.json()
      if (data.status === 'ok') {
        fetchGroupChannel(true)
      } else {
        alert(data.message || 'Failed to send message.')
        setGroupData((prev) => ({
          ...prev,
          messages: (prev?.messages || []).filter((m) => m.message_id !== tempId)
        }))
      }
    } catch (err) {
      alert('Network error: Failed to send message.')
      setGroupData((prev) => ({
        ...prev,
        messages: (prev?.messages || []).filter((m) => m.message_id !== tempId)
      }))
    }
  }

  // Handle Accept/Reject Join Request
  const handleRespondJoinRequest = async (messageId, action) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/group/join-request-response`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_id: messageId,
          user_id: user.uid,
          action: action
        })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        fetchGroupChannel()
      } else {
        alert(data.message || 'Failed to process join request.')
      }
    } catch (err) {
      alert('Network error: Failed to process request.')
    }
  }

  // Handle Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!user || !user.uid) return

    try {
      const res = await fetch(
        `${API_BASE_URL}/api/student/group-channel/message/${messageId}?sent_by=${user.uid}`,
        { method: 'DELETE' }
      )
      const data = await res.json()
      if (data.status === 'ok') {
        fetchGroupChannel()
      } else {
        alert(data.message || 'Failed to delete message.')
      }
    } catch (err) {
      alert('Network error: Failed to delete message.')
    }
  }

  // Handle Leave Group
  const handleLeaveGroup = async () => {
    if (!window.confirm('Are you sure you want to leave this thesis group?')) return
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/group/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: user.uid })
      })
      const data = await res.json()
      if (data.status === 'ok') {
        fetchGroupChannel()
      } else {
        alert(data.message || 'Failed to leave group.')
      }
    } catch (err) {
      alert('Network error: Failed to leave group.')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-rose-50 border border-rose-200 text-rose-900 p-6 rounded-3xl text-sm font-semibold">
        {error}
      </div>
    )
  }

  const hasGroup = groupData && groupData.has_group
  const groupInfo = groupData?.group_info
  const messages = groupData?.messages || []

  return (
    <div className="max-w-5xl mx-auto w-full space-y-6">
      {/* View Mode 1: Student NOT in any Thesis Group */}
      {!hasGroup ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 sm:p-12 text-center space-y-5 shadow-sm">
          <div className="w-16 h-16 bg-sky-100 border border-sky-200 text-blue-950 rounded-3xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-2xl font-extrabold text-black">No Thesis Group Joined</h3>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              You are currently not a member of any thesis group. You can create your own thesis group below or wait to receive group invitations in your Inbox!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3.5 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all shadow-md"
            >
              Create Thesis Group
            </button>
            {onNavigateToThesisGroups && (
              <button
                type="button"
                onClick={onNavigateToThesisGroups}
                className="px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center space-x-2"
              >
                <span>Join a group</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            )}
          </div>

          {/* Create Group Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xl font-extrabold text-black">Create Thesis Group</h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="p-1 text-slate-400 hover:text-black text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {createError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-xl text-xs font-semibold">
                    {createError}
                  </div>
                )}

                <form onSubmit={handleCreateGroup} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                      Thesis Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      placeholder="e.g. Deep Learning Approaches for Medical Imaging"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-black focus:outline-none focus:border-blue-900"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                      Research Domain
                    </label>
                    <select
                      value={selectedDomain}
                      onChange={(e) => setSelectedDomain(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-black focus:outline-none focus:border-blue-900"
                    >
                      {dbDomains.map((dom) => (
                        <option key={dom.domain_id} value={dom.domain_name}>
                          {dom.domain_name}
                        </option>
                      ))}
                      <option value="__custom__">+ Add New Domain</option>
                    </select>

                    {selectedDomain === '__custom__' && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={customDomain}
                          onChange={(e) => setCustomDomain(e.target.value)}
                          placeholder="Type new domain name (e.g. Quantum Computing)"
                          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-black focus:outline-none focus:border-blue-900"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                      Thesis Description
                    </label>
                    <textarea
                      rows={3}
                      value={createDescription}
                      onChange={(e) => setCreateDescription(e.target.value)}
                      placeholder="Brief description of project goals and scope..."
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-black focus:outline-none focus:border-blue-900 resize-none"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating || !createTitle.trim()}
                      className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {creating ? 'Creating...' : 'Create Group'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* View Mode 2: Student is in a Thesis Group */
        <div className="space-y-6">
          {/* Top Banner: Thesis Group Details */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-slate-100 pb-5">
              <div className="space-y-2">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-sky-100 px-3 py-1 rounded-full border border-sky-200">
                    {groupInfo?.domain || 'Domain Not Specified'}
                  </span>
                  
                  {/* Status Badge */}
                  {groupInfo?.formation_status === 'Forming' && (
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                      Accepting Requests
                    </span>
                  )}
                  {groupInfo?.formation_status === 'Pending' && (
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full border border-amber-300">
                      Requests Stopped
                    </span>
                  )}
                  {groupInfo?.formation_status === 'Approved' && (
                    <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-900 bg-indigo-100 px-3 py-1 rounded-full border border-indigo-300">
                      Thesis In Progress
                    </span>
                  )}
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-black leading-tight">
                  {groupInfo?.title || 'No Thesis Topic Selected Yet'}
                </h2>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-start flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleOpenEditThesisModal}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
                >
                  <span>Edit</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>

                <button
                  type="button"
                  onClick={handleOpenChannelMeetingModal}
                  className="px-4 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-2xl text-xs font-bold transition-all flex items-center space-x-1 shadow-xs cursor-pointer"
                >
                  <span>Ask for Meeting</span>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                  </svg>
                </button>

                {groupInfo?.formation_status === 'Forming' && (
                  <button
                    type="button"
                    disabled={togglingStatus}
                    onClick={() => handleToggleStatus('stop_requests')}
                    className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-950 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {togglingStatus ? 'Updating...' : 'Stop Accepting Requests'}
                  </button>
                )}
                {groupInfo?.formation_status === 'Pending' && (
                  <button
                    type="button"
                    disabled={togglingStatus}
                    onClick={() => handleToggleStatus('allow_requests')}
                    className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-950 rounded-2xl text-xs font-bold transition-all cursor-pointer"
                  >
                    {togglingStatus ? 'Updating...' : 'Allow Group Requests'}
                  </button>
                )}
                {groupInfo?.formation_status !== 'Approved' && (
                  <button
                    type="button"
                    onClick={handleLeaveGroup}
                    className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-950 rounded-2xl text-xs font-bold transition-all flex items-center space-x-1 cursor-pointer"
                  >
                    <span>Leave Group</span>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-black uppercase tracking-wider">Thesis Description</h4>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {groupInfo?.description || 'No thesis description provided yet.'}
              </p>
            </div>

            {/* Members & Faculty Supervision Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Group Members List */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-950 flex items-center justify-between">
                  <span>Group Members ({groupInfo?.members?.length || 0})</span>
                  <span className="text-[10px] text-slate-600 font-bold">Group ID: #{groupInfo?.group_id}</span>
                </h4>

                <div className="space-y-2">
                  {groupInfo?.members?.map((m) => (
                    <div
                      key={m.student_id}
                      className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs"
                    >
                      <div className="min-w-0 space-y-0.5">
                        <p className="text-xs font-extrabold text-black truncate">{m.name}</p>
                        <p className="text-[11px] text-slate-600 truncate">{m.email}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          CGPA: {m.CGPA !== null ? m.CGPA.toFixed(2) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Supervision */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-950">
                  Supervision Team
                </h4>

                {!groupInfo?.supervisors || groupInfo.supervisors.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                    <p className="text-xs text-slate-600 font-medium">No supervisor assigned yet.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupInfo.supervisors.map((sup) => (
                      <div
                        key={sup.supervisor_id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-xs"
                      >
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <p className="text-xs font-extrabold text-black truncate">{sup.name}</p>
                            {sup.fac_initial && (
                              <span className="text-[10px] font-bold bg-purple-100 text-purple-900 border border-purple-200 px-1.5 py-0.2 rounded">
                                {sup.fac_initial}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 truncate">{sup.email}</p>
                        </div>
                        <span className="bg-purple-100 text-purple-950 border border-purple-300 font-extrabold px-2 py-0.5 rounded-lg text-[10px] shrink-0">
                          {sup.role || 'Supervisor'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Group Chat Section (Thesis Group Channel) */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col h-[600px]">
            {/* Header */}
            <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 border border-sky-200 flex items-center justify-center font-bold text-blue-950 shrink-0 text-sm">
                  💬
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-black">Group Channel</h3>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 bg-slate-50/40">
              {messages.length === 0 ? (
                <div className="text-center py-16 text-slate-600 text-xs font-medium space-y-2">
                  <p className="font-bold text-sm text-black">No messages in channel yet.</p>
                  <p>Send a message below to start group chat!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.sent_by === user.uid
                  const isFaculty = msg.sender_role === 'Faculty'
                  const isSystemMsg = msg.content.includes('created') || msg.content.includes('joined')

                  if (isSystemMsg) {
                    return (
                      <div
                        key={msg.message_id}
                        className="max-w-md mx-auto my-2 bg-sky-50 border border-sky-200 rounded-xl p-3 text-center shadow-xs"
                      >
                        <p className="text-xs text-blue-950 font-bold leading-relaxed">
                          {msg.content}
                        </p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{msg.formatted_time}</p>
                      </div>
                    )
                  }

                  const isJoinRequest = msg.content.includes('[Join Request:')
                  if (isJoinRequest) {
                    const isAccepted = msg.content.includes(':ACCEPTED]')
                    const isRejected = msg.content.includes(':REJECTED]')
                    const isPending = !isAccepted && !isRejected

                    // Parse voted member IDs from :VOTES:uid1,uid2
                    const votesMatch = msg.content.match(/:VOTES:([\d,]*)/)
                    const votedUids = votesMatch && votesMatch[1] ? votesMatch[1].split(',').map(Number) : []
                    const hasIAlreadyVoted = votedUids.includes(user.uid)
                    const totalMembers = groupInfo?.members?.length || 1

                    const cleanText = msg.content.replace(/^\[Join Request:\d+(?::VOTES:[\d,]*)?(?::ACCEPTED|:REJECTED)?\]\s*/, '')

                    return (
                      <div
                        key={msg.message_id}
                        className="max-w-xl mx-auto my-3 bg-sky-50 border border-sky-200 rounded-2xl p-5 shadow-sm space-y-3"
                      >
                        <div className="flex items-start space-x-3">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center space-x-2 flex-wrap gap-1">
                              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-950 bg-sky-200/70 px-2 py-0.5 rounded-md">
                                Join Group Request
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
                              {isPending && (
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                                  {votedUids.length}/{totalMembers} Accepted (Requires Unanimous)
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-black font-extrabold leading-relaxed mt-1">
                              {cleanText}
                            </p>
                            <p className="text-[10px] text-slate-600 font-medium">{msg.formatted_time}</p>
                          </div>
                        </div>

                        {isPending && (
                          <div className="pt-2 border-t border-sky-200/60">
                            {hasIAlreadyVoted ? (
                              <div className="w-full py-2 bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold text-center flex items-center justify-center space-x-2">
                                <span>You accepted ✓ (Waiting for remaining members)</span>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-3">
                                <button
                                  type="button"
                                  onClick={() => handleRespondJoinRequest(msg.message_id, 'accept')}
                                  className="flex-1 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                                >
                                  Accept Applicant ✓
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRespondJoinRequest(msg.message_id, 'reject')}
                                  className="flex-1 py-2 bg-rose-700 hover:bg-rose-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                                >
                                  Reject Request ✕
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={msg.message_id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      {/* Display Sender Name and Role Tag */}
                      <div className="flex items-center space-x-2 mb-1 px-1">
                        <span className="text-[11px] font-extrabold text-black">
                          {isMe ? 'You' : msg.sender_name}
                        </span>
                        {isFaculty ? (
                          <span className="bg-purple-100 text-purple-950 border border-purple-300 font-extrabold px-1.5 py-0.2 rounded text-[9px]">
                            {msg.sender_role}
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-950 border border-emerald-300 font-bold px-1.5 py-0.2 rounded text-[9px]">
                            {msg.sender_role}
                          </span>
                        )}
                      </div>

                      <div className={`flex items-end space-x-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
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
                                {msg.content}
                              </p>
                              {msg.formatted_time && !msg.isSending && (
                                <p
                                  className={`text-[10px] font-medium ${
                                    isMe ? 'text-blue-200' : 'text-slate-600'
                                  }`}
                                >
                                  {msg.formatted_time}
                                </p>
                              )}
                            </div>

                            {isMe && !msg.isSending && (
                              <button
                                type="button"
                                onClick={() => handleDeleteMessage(msg.message_id)}
                                title="Delete message"
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-xs text-blue-300 hover:text-white hover:bg-blue-800 rounded"
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-200 flex items-center space-x-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message in group channel..."
                required
                className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-2xl text-black text-xs sm:text-sm focus:outline-none focus:border-blue-900 transition-all"
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

          {/* Ask for Meeting Modal (Group Channel) */}
          {showChannelMeetingModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-lg font-black text-black">Ask Supervisor for Meeting</h3>
                    <p className="text-[11px] text-slate-600">Schedule a meeting with your thesis group's assigned supervisor.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowChannelMeetingModal(false)}
                    className="text-slate-600 hover:text-black font-bold p-1"
                  >
                    ✕
                  </button>
                </div>

                {channelMeetingError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3 rounded-xl text-xs font-bold">
                    {channelMeetingError}
                  </div>
                )}

                <form onSubmit={handleRequestChannelMeeting} className="space-y-4">
                  <div>
                    <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-1">
                      Select Supervisor / Co-Supervisor
                    </label>
                    {groupInfo?.supervisors && groupInfo.supervisors.length > 0 ? (
                      <select
                        value={selectedSupId}
                        onChange={(e) => setSelectedSupId(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-blue-900"
                      >
                        {groupInfo.supervisors.map((s) => (
                          <option key={s.supervisor_id} value={s.supervisor_id}>
                            {s.name} ({s.role} {s.fac_initial ? `- ${s.fac_initial}` : ''})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <p className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-bold">
                        No supervisor assigned to this thesis group yet. You can schedule meetings with any host from the Meetings tab!
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-1">
                        Date
                      </label>
                      <input
                        type="date"
                        value={channelMeetingDate}
                        onChange={(e) => setChannelMeetingDate(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-blue-900"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-black uppercase tracking-wider mb-1">
                        Select Time Slot
                      </label>
                      <select
                        value={channelMeetingSlot}
                        onChange={(e) => setChannelMeetingSlot(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-black font-bold focus:outline-none focus:border-blue-900"
                      >
                        {PREDEFINED_SLOTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-[11px] text-slate-600 font-medium">
                    <strong>Note:</strong> Room number or meeting link will be provided by the supervisor upon accepting the meeting request.
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowChannelMeetingModal(false)}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-black text-xs font-bold rounded-xl"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingChannelMeeting || !groupInfo?.supervisors?.length}
                      className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                    >
                      {submittingChannelMeeting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Thesis Info Modal */}
          {showEditThesisModal && (
            <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-5 shadow-2xl text-left">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xl font-extrabold text-black">Edit Thesis Details</h3>
                  <button
                    type="button"
                    onClick={() => setShowEditThesisModal(false)}
                    className="p-1 text-slate-400 hover:text-black text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                {editThesisError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-900 p-3.5 rounded-xl text-xs font-semibold">
                    {editThesisError}
                  </div>
                )}

                <form onSubmit={handleUpdateThesisInfo} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                      Thesis Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      placeholder="e.g. Deep Learning Approaches for Medical Imaging"
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-black focus:outline-none focus:border-blue-900 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                      Research Domain
                    </label>
                    <select
                      value={selectedEditDomain}
                      onChange={(e) => setSelectedEditDomain(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-black focus:outline-none focus:border-blue-900 font-bold"
                    >
                      {dbDomains.map((dom) => (
                        <option key={dom.domain_id} value={dom.domain_name}>
                          {dom.domain_name}
                        </option>
                      ))}
                      <option value="__custom__">+ Add New Domain</option>
                    </select>

                    {selectedEditDomain === '__custom__' && (
                      <input
                        type="text"
                        required
                        value={customEditDomain}
                        onChange={(e) => setCustomEditDomain(e.target.value)}
                        placeholder="Enter custom research domain name"
                        className="w-full mt-2 px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-black focus:outline-none focus:border-blue-900 font-bold"
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-black uppercase tracking-wider mb-1">
                      Thesis Description
                    </label>
                    <textarea
                      rows="4"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Describe your research scope, objectives, and methodologies..."
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-xs text-black focus:outline-none focus:border-blue-900 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowEditThesisModal(false)}
                      className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updatingThesis}
                      className="px-5 py-2.5 bg-blue-900 hover:bg-blue-950 text-white rounded-xl text-xs font-bold transition-all shadow-md disabled:opacity-50"
                    >
                      {updatingThesis ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
