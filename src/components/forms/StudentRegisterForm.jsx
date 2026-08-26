import React from 'react'

export default function StudentRegisterForm({
  cgpa,
  setCgpa,
  creditsCompleted,
  setCreditsCompleted,
  hasDoneThesis,
  setHasDoneThesis,
  selectedDomain,
  setSelectedDomain,
  customDomain,
  setCustomDomain,
  domainsList,
  semNo,
  setSemNo
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
            CGPA
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4.00"
            value={cgpa}
            onChange={(e) => setCgpa(e.target.value)}
            placeholder="3.85"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
            Credits Completed
          </label>
          <input
            type="number"
            value={creditsCompleted}
            onChange={(e) => setCreditsCompleted(e.target.value)}
            placeholder="112"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
            Semester No.
          </label>
          <input
            type="number"
            min="1"
            max="20"
            value={semNo}
            onChange={(e) => setSemNo(e.target.value)}
            placeholder="7"
            required
            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
          Has Completed Thesis Previously?
        </label>
        <select
          value={hasDoneThesis}
          onChange={(e) => setHasDoneThesis(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all"
        >
          <option value="false">No (First Thesis)</option>
          <option value="true">Yes</option>
        </select>
      </div>

      {/* Preferred Research Domain */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-black mb-1.5">
          Preferred Research Domain
        </label>
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-black text-sm focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 transition-all mb-2"
        >
          {domainsList.map((dom) => (
            <option key={dom} value={dom}>
              {dom}
            </option>
          ))}
          <option value="__CUSTOM__">Add / Type New Custom Domain</option>
        </select>

        {selectedDomain === '__CUSTOM__' && (
          <input
            type="text"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            placeholder="Enter your custom domain name (e.g. Quantum Computing)"
            required
            className="w-full px-4 py-2.5 bg-sky-50 border border-sky-300 rounded-xl text-black placeholder-slate-400 text-sm focus:outline-none focus:ring-1 focus:ring-blue-900"
          />
        )}
      </div>
    </>
  )
}

