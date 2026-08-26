import { useState, useEffect } from 'react'
import LoginInterface from './components/LoginInterface'
import StudentInterface from './components/StudentInterface'
import DatabaseInspector from './components/DatabaseInspector'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

  const handleLogout = () => {
    setCurrentUser(null)
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
  return <LoginInterface onLoginSuccess={(user) => setCurrentUser(user)} />
}

export default App
