import { useState } from 'react'
import StudentProfileSection from './student/StudentProfileSection'
import SearchStudentsSection from './student/SearchStudentsSection'
import SearchFacultiesSection from './student/SearchFacultiesSection'
import BlogpostsSection from './student/BlogpostsSection'
import PublicationsSection from './student/PublicationsSection'

export default function StudentInterface({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [searchPreFill, setSearchPreFill] = useState({ targetTab: '', query: '', key: 0 })

  const handleNavigateToSearch = (tab, writerName) => {
    setSearchPreFill({ targetTab: tab, query: writerName, key: Date.now() })
    setActiveTab(tab)
    setIsSidebarOpen(false)
  }

  const navItems = [
    { id: 'profile', label: 'Student Profile' },
    { id: 'thesis_group', label: 'Thesis Group' },
    { id: 'group_channel', label: 'Thesis Group Chat' },
    { id: 'meetings', label: 'Meetings' },
    { id: 'search_students', label: 'Search Students' },
    { id: 'search_faculties', label: 'Search Faculties' },
    { id: 'blogposts', label: 'Blogposts' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'publications', label: 'Publications' }
  ]

  const renderActiveSection = () => {
    switch (activeTab) {
      case 'profile':
        return <StudentProfileSection user={user} />
      case 'search_students':
        return (
          <SearchStudentsSection
            key={`students-${searchPreFill.key}`}
            initialQuery={searchPreFill.targetTab === 'search_students' ? searchPreFill.query : ''}
          />
        )
      case 'search_faculties':
        return (
          <SearchFacultiesSection
            key={`faculties-${searchPreFill.key}`}
            initialQuery={searchPreFill.targetTab === 'search_faculties' ? searchPreFill.query : ''}
          />
        )
      case 'blogposts':
        return (
          <BlogpostsSection
            user={user}
            onNavigateToSearch={handleNavigateToSearch}
          />
        )
      case 'publications':
        return (
          <PublicationsSection
            user={user}
            onNavigateToSearch={handleNavigateToSearch}
          />
        )
      default:



        return (
          <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-sm">
            <h3 className="text-xl font-bold text-black">
              {navItems.find((n) => n.id === activeTab)?.label || 'Inbox'}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              This section is currently queued for implementation. Select <strong>Student Profile</strong>, <strong>Search Students</strong>, or <strong>Search Faculties</strong> to interact with completed features.
            </p>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-white text-black flex flex-col">
      {/* Sticky Top Header */}
      <header className="bg-white/95 border-b border-slate-200 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 py-3 shadow-xs">
        {/* Left Block: Hamburger Button + Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="lg:hidden p-2 rounded-xl border border-slate-200 text-black hover:bg-sky-50 transition-colors"
            aria-label="Toggle navigation menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg sm:text-xl font-black text-blue-950 tracking-wider bg-sky-100 px-2.5 sm:px-3 py-1 rounded-xl border border-sky-200 shrink-0">
            BRACU
          </span>
        </div>

        {/* Center Title */}
        <div className="flex flex-row items-center space-x-2 sm:space-x-3">
          <h1 className="text-lg sm:text-2xl font-extrabold text-blue-950 leading-tight truncate">
            Thesis Hunt
          </h1>
          <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-blue-900 border border-sky-200 shrink-0">
            Student Portal
          </span>
        </div>

        {/* Right Options */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <button
            type="button"
            onClick={() => {
              setActiveTab('inbox')
              setIsSidebarOpen(false)
            }}
            title="Inbox"
            className={`p-2 sm:p-2.5 rounded-xl border transition-all ${
              activeTab === 'inbox'
                ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                : 'bg-white text-black hover:bg-sky-50 border-slate-200'
            }`}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </button>

          <button
            onClick={onLogout}
            className="px-3 sm:px-4 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-black hover:text-rose-800 rounded-xl text-xs font-bold transition-all shadow-xs shrink-0"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container: Left Sidebar & Content */}
      <div className="flex flex-1 min-h-0 relative">
        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          />
        )}

        {/* Left Vertical Navigation Panel */}
        <aside
          className={`fixed lg:sticky top-0 lg:top-[61px] left-0 h-full lg:h-[calc(100vh-61px)] z-50 lg:z-30 w-64 bg-white border-r border-slate-200 flex flex-col shrink-0 transition-transform duration-200 ease-in-out ${
            isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Close button inside mobile sidebar header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 lg:hidden">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-950">
              Navigation
            </span>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-500 hover:text-black hover:bg-slate-100 text-sm font-bold"
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id)
                    setIsSidebarOpen(false)
                  }}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-sky-100 text-blue-950 border border-sky-200 shadow-xs'
                      : 'text-black hover:bg-sky-50 border border-transparent'
                  }`}
                >
                  <span className="truncate">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* User Info Footer at bottom of sidebar */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <p className="text-xs font-bold text-black truncate">{user?.name}</p>
            <p className="text-[11px] text-slate-700 truncate">{user?.email}</p>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto min-w-0 bg-white flex flex-col items-center">
          <div className="w-full max-w-6xl mx-auto flex-1">
            {renderActiveSection()}
          </div>
        </main>
      </div>
    </div>
  )
}


