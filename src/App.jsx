import { useState, useEffect } from 'react'
import LoginInterface from './components/LoginInterface'
import StudentInterface from './components/StudentInterface'
import DatabaseInspector from './components/DatabaseInspector'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('thesis_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  const handleLoginSuccess = (user) => {
    setCurrentUser(user)
    try {
      localStorage.setItem('thesis_user', JSON.stringify(user))
    } catch {}
  }

  const handleLogout = () => {
    setCurrentUser(null)
    try {
      localStorage.removeItem('thesis_user')
    } catch {}
    window.history.pushState({}, '', '/')
  }

  // Render Database Inspector GUI if path starts with /db
  if (currentPath.startsWith('/db')) {
    return <DatabaseInspector />
  }

  // If logged in as Student, render StudentInterface
  if (currentUser && currentUser.role === 'Student') {
    return <StudentInterface user={currentUser} onLogout={handleLogout} />
  }

  // Default path (/): Render Login and Registration interface
  return <LoginInterface onLoginSuccess={handleLoginSuccess} />
}

export default App
