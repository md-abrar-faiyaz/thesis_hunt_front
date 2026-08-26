import { useState } from 'react'
import StudentProfileSection from './student/StudentProfileSection'
import SearchStudentsSection from './student/SearchStudentsSection'
import SearchFacultiesSection from './student/SearchFacultiesSection'

export default function StudentInterface({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('profile')

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
        return <SearchStudentsSection />
      case 'search_faculties':
        return <SearchFacultiesSection />
      default:
        return (
          <div className="max-w-4xl bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-sm">
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
      <header className="relative bg-white/95 border-b border-slate-200 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between px-4 sm:px-6 py-3 shadow-xs">
        {/* Left Block (aligned above left vertical panel) */}
        <div className="w-64 shrink-0 flex items-center pr-4">
          <span className="text-xl font-black text-blue-950 tracking-wider bg-sky-100 px-3 py-1 rounded-xl border border-sky-200">
            BRACU
          </span>
        </div>

        {/* Center / Title (Exact midpoint of full page width, side-by-side) */}
        <div className="absolute left-1/2 -translate-x-1/2 flex flex-row items-center space-x-3 pointer-events-none">
          <h1 className="text-2xl font-extrabold text-blue-950 leading-tight">
            Thesis Hunt
          </h1>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-100 text-blue-900 border border-sky-200 pointer-events-auto">
            Student Portal
          </span>
        </div>

        {/* Right Options: Minimal Inbox Icon & Sign Out */}
        <div className="flex items-center space-x-3">
          {/* Minimal Inbox Icon (No text) */}
          <button
            type="button"
            onClick={() => setActiveTab('inbox')}
            title="Inbox"
            className={`p-2.5 rounded-xl border transition-all ${
              activeTab === 'inbox'
                ? 'bg-blue-900 text-white border-blue-900 shadow-sm'
                : 'bg-white text-black hover:bg-sky-50 border-slate-200'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </button>

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 text-black hover:text-rose-800 rounded-xl text-xs font-bold transition-all shadow-xs"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container: Left Sidebar & Content */}
      <div className="flex flex-1 min-h-0">
        {/* Left Vertical Navigation Panel (Text-only links) */}
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shrink-0">
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
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
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto min-w-0 bg-white">
          {renderActiveSection()}
        </main>
      </div>
    </div>
  )
}

