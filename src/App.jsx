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
      if (!saved) return null
      const parsed = JSON.parse(saved)
      if (!parsed) return null
      const userId = parsed.uid || parsed.UID || parsed.faculty_id || parsed.student_id
      const userRole = (parsed.role || '').toString().trim()
      return {
        ...parsed,
        uid: userId,
        role: userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase() : parsed.role
      }
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
    const userRole = (currentUser?.role || '').toString().trim().toLowerCase()
    if (currentUser && userRole === 'student' && currentUser.uid) {
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
  }, [currentUser?.uid, currentUser?.role])

  const handleLoginSuccess = (user) => {
    if (!user) return
    const userId = user.uid || user.UID || user.faculty_id || user.student_id
    const userRole = (user.role || '').toString().trim()
    const normalizedUser = {
      ...user,
      uid: userId,
      role: userRole ? userRole.charAt(0).toUpperCase() + userRole.slice(1).toLowerCase() : user.role,
      has_done_thesis: Boolean(
        user.has_done_thesis === true ||
        user.has_done_thesis === 1 ||
        user.has_done_thesis === 'true' ||
        user.has_done_thesis === '1'
      )
    }
    setCurrentUser(normalizedUser)
    try {
      localStorage.setItem('thesis_user', JSON.stringify(normalizedUser))
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

  // Determine if current student user has completed thesis
  const isThesisDone = Boolean(
    currentUser?.has_done_thesis === true ||
    currentUser?.has_done_thesis === 1 ||
    currentUser?.has_done_thesis === 'true' ||
    currentUser?.has_done_thesis === '1'
  )

  const activeRole = (currentUser?.role || '').toString().trim().toLowerCase()

  // If logged in as Student, render appropriate interface based on has_done_thesis status
  if (currentUser && activeRole === 'student') {
    if (isThesisDone) {
      return <ThesisDoneStudentInterface user={currentUser} onLogout={handleLogout} />
    }
    return <StudentInterface user={currentUser} onLogout={handleLogout} />
  }

  // If logged in as Faculty, render Faculty Interface
  if (currentUser && activeRole === 'faculty') {
    return <FacultyInterface user={currentUser} onLogout={handleLogout} />
  }

  // Default path (/): Render Login and Registration interface
  return <LoginInterface onLoginSuccess={handleLoginSuccess} />
}


export default App
