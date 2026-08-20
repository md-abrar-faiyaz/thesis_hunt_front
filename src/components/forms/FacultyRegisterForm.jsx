import React from 'react'

export default function FacultyRegisterForm({
  facInitial,
  setFacInitial,
  rank,
  setRank,
  ugPg,
  setUgPg,
  semFreeFrom,
  setSemFreeFrom,
  maxGrpPerSem,
  setMaxGrpPerSem,
  totalSupervised,
  setTotalSupervised,
  roomNo,
  setRoomNo,
  calendarLink,
  setCalendarLink,
  selectedDomain,
  setSelectedDomain,
  customDomain,
  setCustomDomain,
  domainsList
}) {
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Faculty Initial
          </label>
          <input
            type="text"
            value={facInitial}
            onChange={(e) => setFacInitial(e.target.value)}
            placeholder="MDF"
            required
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Designation / Rank
          </label>
          <select
            value={rank}
            onChange={(e) => setRank(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          >
            <option value="Professor">Professor</option>
            <option value="Associate Professor">Associate Professor</option>
            <option value="Assistant Professor">Assistant Professor</option>
            <option value="Senior Lecturer">Senior Lecturer</option>
            <option value="Lecturer">Lecturer</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            UG / PG Focus
          </label>
          <select
            value={ugPg}
            onChange={(e) => setUgPg(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          >
            <option value="Undergraduate">Undergraduate (UG)</option>
            <option value="Postgraduate">Postgraduate (PG)</option>
            <option value="Both">Both (UG & PG)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Semester Free From
          </label>
          <input
            type="text"
            value={semFreeFrom}
            onChange={(e) => setSemFreeFrom(e.target.value)}
            placeholder="Fall 2026"
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Max Groups / Sem
          </label>
          <input
            type="number"
            value={maxGrpPerSem}
            onChange={(e) => setMaxGrpPerSem(e.target.value)}
            placeholder="4"
            required
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Total Supervised
          </label>
          <input
            type="number"
            value={totalSupervised}
            onChange={(e) => setTotalSupervised(e.target.value)}
            placeholder="0"
            required
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Room Number
          </label>
          <input
            type="text"
            value={roomNo}
            onChange={(e) => setRoomNo(e.target.value)}
            placeholder="UB70102"
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Calendar Link
          </label>
          <input
            type="url"
            value={calendarLink}
            onChange={(e) => setCalendarLink(e.target.value)}
            placeholder="https://calendar.google.com/..."
            className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500 transition-all"
          />
        </div>
      </div>

      {/* Research Domain */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
          Research Domain (Work On Domain)
        </label>
        <select
          value={selectedDomain}
          onChange={(e) => setSelectedDomain(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-700/60 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-all mb-2"
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
            placeholder="Enter custom research domain name"
            required
            className="w-full px-4 py-2.5 bg-slate-950 border border-cyan-500/60 rounded-xl text-cyan-300 placeholder-slate-500 text-sm focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        )}
      </div>
    </>
  )
}
