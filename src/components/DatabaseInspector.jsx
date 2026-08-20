import { useState, useEffect } from 'react'
import { API_BASE_URL } from '../config'

export default function DatabaseInspector() {
  const [apiMessage, setApiMessage] = useState('Connecting to backend...')
  const [healthStatus, setHealthStatus] = useState(null)
  const [dbData, setDbData] = useState({})
  const [loadingDb, setLoadingDb] = useState(false)
  const [selectedTable, setSelectedTable] = useState('')
  const [viewMode, setViewMode] = useState('tabular')

  const fetchBackendData = () => {
    fetch(`${API_BASE_URL}/`)
      .then((res) => res.json())
      .then((data) => setApiMessage(data.message))
      .catch(() => setApiMessage('Failed to connect to backend server'))

    fetch(`${API_BASE_URL}/health`)
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch(() => setHealthStatus({ status: 'error', db_connection: 'Backend unavailable' }))

    setLoadingDb(true)
    fetch(`${API_BASE_URL}/api/tables`)
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setDbData(data.tables || {})
          const tableNames = Object.keys(data.tables || {})
          if (tableNames.length > 0 && !selectedTable) {
            setSelectedTable(tableNames[0])
          }
        }
      })
      .catch((err) => console.error('Error fetching database tables:', err))
      .finally(() => setLoadingDb(false))
  }

  useEffect(() => {
    fetchBackendData()
  }, [])

  const tableNames = Object.keys(dbData)
  const currentRows = selectedTable ? dbData[selectedTable] || [] : []
  const columns = currentRows.length > 0 ? Object.keys(currentRows[0]) : []

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-800">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
            Thesis Hunt
          </h1>
          <p className="text-slate-400 text-sm mt-1">Academic Database Explorer & API Portal</p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${apiMessage.includes('Welcome') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="text-xs text-slate-300 font-medium">{apiMessage}</span>
          </div>

          <div className="bg-slate-800/80 px-4 py-2 rounded-xl border border-slate-700/50 flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${healthStatus?.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className="text-xs text-slate-300 font-medium">
              {healthStatus ? `DB: ${healthStatus.db_connection}` : 'Checking DB...'}
            </span>
          </div>

          <button
            onClick={fetchBackendData}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-cyan-400 transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Database Inspector View */}
      <main className="flex-1 flex flex-col gap-6">
        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700/50 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-100">Database Inspector</h2>
              <p className="text-xs text-slate-400">View real-time records directly fetched from MySQL database</p>
            </div>

            <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-700/50">
              <button
                onClick={() => setViewMode('tabular')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'tabular'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tabular View
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'json'
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                JSON View
              </button>
            </div>
          </div>

          {loadingDb ? (
            <div className="py-12 text-center text-slate-400 animate-pulse">
              Loading database tables...
            </div>
          ) : tableNames.length === 0 ? (
            <div className="py-12 text-center bg-slate-900/40 rounded-xl border border-slate-700/30">
              <p className="text-slate-300 font-medium">No database tables found or database connection pending.</p>
              <p className="text-xs text-slate-500 mt-1">Make sure your Aiven database credentials are configured in <code className="text-cyan-400">backend/.env</code></p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-700/50 pb-4">
                {tableNames.map((tableName) => (
                  <button
                    key={tableName}
                    onClick={() => setSelectedTable(tableName)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedTable === tableName
                        ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-slate-900/60 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200 border border-slate-700/40'
                    }`}
                  >
                    {tableName} <span className="ml-1.5 px-2 py-0.5 bg-slate-950/40 rounded-full text-[10px] text-cyan-300">{dbData[tableName]?.length || 0}</span>
                  </button>
                ))}
              </div>

              {viewMode === 'tabular' ? (
                <div className="overflow-x-auto rounded-xl border border-slate-700/50 bg-slate-900/60">
                  {currentRows.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-sm">
                      Table <span className="font-semibold text-cyan-400">"{selectedTable}"</span> is empty.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-800/80 text-cyan-400 uppercase font-mono border-b border-slate-700/50">
                        <tr>
                          {columns.map((col) => (
                            <th key={col} className="px-4 py-3 font-semibold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {currentRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            {columns.map((col) => (
                              <td key={col} className="px-4 py-3 whitespace-nowrap">
                                {row[col] === null ? (
                                  <span className="text-slate-600 italic">null</span>
                                ) : (
                                  String(row[col])
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 overflow-x-auto">
                  <pre className="text-xs font-mono text-cyan-300 leading-relaxed">
                    {JSON.stringify(selectedTable ? { [selectedTable]: currentRows } : dbData, null, 2)}
                  </pre>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  )
}
