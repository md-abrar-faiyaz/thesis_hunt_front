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
    <div className="min-h-screen bg-white text-black flex flex-col p-6 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200">
        <div>
          <h1 className="text-4xl font-extrabold text-blue-950">
            Thesis Hunt
          </h1>
          <p className="text-black text-sm mt-1 font-medium">Academic Database Explorer & API Portal</p>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${apiMessage.includes('Welcome') ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
            <span className="text-xs text-black font-semibold">{apiMessage}</span>
          </div>

          <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 flex items-center gap-2 shadow-xs">
            <span className={`h-2.5 w-2.5 rounded-full ${healthStatus?.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
            <span className="text-xs text-black font-semibold">
              {healthStatus ? `DB: ${healthStatus.db_connection}` : 'Checking DB...'}
            </span>
          </div>

          <button
            onClick={fetchBackendData}
            className="px-3.5 py-2 bg-blue-900 hover:bg-blue-950 border border-blue-900 rounded-xl text-xs font-bold text-white transition-colors shadow-xs"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Database Inspector View */}
      <main className="flex-1 flex flex-col gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-black">Database Inspector</h2>
              <p className="text-xs text-black font-medium">View real-time records directly fetched from MySQL database</p>
            </div>

            <div className="flex items-center bg-white p-1 rounded-xl border border-slate-200 shadow-xs">
              <button
                onClick={() => setViewMode('tabular')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'tabular'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-black hover:text-blue-900'
                }`}
              >
                Tabular View
              </button>
              <button
                onClick={() => setViewMode('json')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === 'json'
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'text-black hover:text-blue-900'
                }`}
              >
                JSON View
              </button>
            </div>
          </div>

          {loadingDb ? (
            <div className="py-12 text-center text-black animate-pulse font-medium">
              Loading database tables...
            </div>
          ) : tableNames.length === 0 ? (
            <div className="py-12 text-center bg-white rounded-xl border border-slate-200">
              <p className="text-black font-bold">No database tables found or database connection pending.</p>
              <p className="text-xs text-slate-600 mt-1">Make sure your database credentials are configured in <code className="text-blue-900 font-mono">backend/.env</code></p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200 pb-4">
                {tableNames.map((tableName) => (
                  <button
                    key={tableName}
                    onClick={() => setSelectedTable(tableName)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                      selectedTable === tableName
                        ? 'bg-blue-900 text-white shadow-xs'
                        : 'bg-white text-black hover:bg-sky-50 hover:border-sky-300 border border-slate-200'
                    }`}
                  >
                    {tableName} <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${selectedTable === tableName ? 'bg-blue-950 text-sky-200' : 'bg-sky-100 text-blue-950 border border-sky-200'}`}>{dbData[tableName]?.length || 0}</span>
                  </button>
                ))}
              </div>

              {viewMode === 'tabular' ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  {currentRows.length === 0 ? (
                    <div className="p-8 text-center text-black font-medium text-sm">
                      Table <span className="font-bold text-blue-950">"{selectedTable}"</span> is empty.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs text-black">
                      <thead className="bg-sky-50 text-blue-950 uppercase font-mono border-b border-slate-200">
                        <tr>
                          {columns.map((col) => (
                            <th key={col} className="px-4 py-3 font-bold">
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-sky-50/40 transition-colors">
                            {columns.map((col) => (
                              <td key={col} className="px-4 py-3 whitespace-nowrap">
                                {row[col] === null ? (
                                  <span className="text-slate-400 italic">null</span>
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
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 overflow-x-auto">
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

