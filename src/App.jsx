import { useState, useEffect } from 'react'
import LoginInterface from './components/LoginInterface'
import DatabaseInspector from './components/DatabaseInspector'

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname)

  useEffect(() => {
    const handleLocationChange = () => setCurrentPath(window.location.pathname)
    window.addEventListener('popstate', handleLocationChange)
    return () => window.removeEventListener('popstate', handleLocationChange)
  }, [])

<<<<<<< HEAD
  // If path starts with /db, render Database Inspector GUI
=======
  // Render Database Inspector GUI if path starts with /db
>>>>>>> 73ba843 (Refactor frontend into modular components)
  if (currentPath.startsWith('/db')) {
    return <DatabaseInspector />
  }

  // Default path (/): Render Login and Registration interface
  return <LoginInterface />
}

export default App
