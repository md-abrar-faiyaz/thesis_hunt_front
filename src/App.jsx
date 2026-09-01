import { useState, useEffect } from 'react'
import LoginInterface from './components/LoginInterface'
import StudentInterface from './components/StudentInterface'
import ThesisDoneStudentInterface from './components/ThesisDoneStudentInterface'
import FacultyInterface from './components/FacultyInterface'
import DatabaseInspector from './components/DatabaseInspector'
import { API_BASE_URL } from './config'

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

  // Auto-sync has_done_thesis for student sessions with MySQL database
  useEffect(() => {
    if (currentUser && currentUser.role === 'Student' && currentUser.uid) {
      fetch(`${API_BASE_URL}/api/student/profile/${currentUser.uid}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.status === 'ok' && data.student) {
            const isDone = Boolean(
              data.student.has_done_thesis === true ||
              data.student.has_done_thesis === 1 ||
              data.student.has_done_thesis === 'true' ||
              data.student.has_done_thesis === '1'
            )
            if (currentUser.has_done_thesis !== isDone) {
              const updatedUser = { ...currentUser, has_done_thesis: isDone }
              setCurrentUser(updatedUser)
              try {
                localStorage.setItem('thesis_user', JSON.stringify(updatedUser))
              } catch {}
            }
          }
        })
        .catch(() => {})
    }
  }, [currentUser?.uid])

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

  // Determine if current student user has completed thesis (handles bool, int 1/0, and string "true"/"1")
  const isThesisDone = Boolean(
    currentUser?.has_done_thesis === true ||
    currentUser?.has_done_thesis === 1 ||
    currentUser?.has_done_thesis === 'true' ||
    currentUser?.has_done_thesis === '1'
  )

  // If logged in as Student, render appropriate interface based on has_done_thesis status
  if (currentUser && currentUser.role === 'Student') {
    if (isThesisDone) {
      return <ThesisDoneStudentInterface user={currentUser} onLogout={handleLogout} />
    }
    return <StudentInterface user={currentUser} onLogout={handleLogout} />
  }

  // If logged in as Faculty, render Faculty Interface
  if (currentUser && currentUser.role === 'Faculty') {
    return <FacultyInterface user={currentUser} onLogout={handleLogout} />
  }

  // Default path (/): Render Login and Registration interface
  return <LoginInterface onLoginSuccess={handleLoginSuccess} />
}


export default App
