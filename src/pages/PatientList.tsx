import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, X, FileSpreadsheet, Upload } from 'lucide-react'
import readXlsxFile from 'read-excel-file/browser'
import { usePatients, createPatient, createPatients } from '@/hooks/usePatients'
import { useAuth } from '@/contexts/AuthContext'
import { useLocation } from '@/contexts/LocationContext'
import type { ClinicLocation } from '@/contexts/LocationContext'

export default function PatientList() {
  const [search, setSearch] = useState('')
  const { selectedLocationId, locations, selectLocation } = useLocation()
  const [allLocations, setAllLocations] = useState(false)
  const patientLocationId = allLocations ? 'all' : selectedLocationId
  const { patients, loading, refetch } = usePatients(search, patientLocationId)
  const [showModal, setShowModal] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const navigate = useNavigate()

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-display font-semibold text-slate-text">Patients</h1>
          <p className="text-slate-muted text-sm mt-1">
            {patients.length} patient{patients.length === 1 ? '' : 's'} on record
          </p>
        </div>
        <div className="flex w-full md:w-auto flex-col sm:flex-row gap-2 mt-3 md:mt-0">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center justify-center gap-2 border border-[var(--color-border-soft)] bg-white hover:bg-gray-50 text-slate-text text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <FileSpreadsheet size={16} />
            Import Spreadsheet
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add Patient
          </button>
        </div>
      </div>

      <div className="relative mb-5 w-full md:max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-muted" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search patients by name…"
          className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[var(--color-border-soft)] bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
        />
      </div>

      <div className="mb-5 flex items-center gap-3">
        <label htmlFor="patient-location-filter" className="text-sm font-medium text-slate-muted">Clinic</label>
        <select
          id="patient-location-filter"
          value={allLocations ? 'all' : selectedLocationId ?? ''}
          onChange={(event) => {
            if (event.target.value === 'all') setAllLocations(true)
            else {
              setAllLocations(false)
              selectLocation(event.target.value)
            }
          }}
          className="max-w-full rounded-lg border border-[var(--color-border-soft)] bg-white px-3 py-2 text-sm text-slate-text focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
        >
          <option value="all">All locations</option>
          {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
        </select>
      </div>

      {/* Desktop/tablet: table view */}
      <div className="hidden md:block bg-white rounded-xl border border-[var(--color-border-soft)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border-soft)] text-left text-slate-muted">
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Case note no.</th>
              <th className="px-5 py-3 font-medium">Clinic</th>
              <th className="px-5 py-3 font-medium">Phone</th>
              <th className="px-5 py-3 font-medium">Date of birth</th>
              <th className="px-5 py-3 font-medium">Added</th>
            </tr>
          </thead>
          <tbody>
            {!loading && patients.length === 0 && (
              <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-slate-muted">
                  No patients yet. Add the first one to get started.
                </td>
              </tr>
            )}
            {patients.map((p) => (
              <tr
                key={p.id}
                onClick={() => navigate(`/patients/${p.id}`)}
                className="border-b border-[var(--color-border-soft)] last:border-0 hover:bg-[var(--color-clinic-orange-tint)] cursor-pointer transition-colors"
              >
                <td className="px-5 py-3 font-medium text-slate-text">{p.full_name}</td>
                <td className="px-5 py-3 text-slate-muted">{p.case_note_number ?? '—'}</td>
                <td className="px-5 py-3 text-slate-muted">{locations.find((location) => location.id === p.location_id)?.name ?? '—'}</td>
                <td className="px-5 py-3 text-slate-muted">{p.phone ?? '—'}</td>
                <td className="px-5 py-3 text-slate-muted">{p.date_of_birth ?? '—'}</td>
                <td className="px-5 py-3 text-slate-muted">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards */}
      <div className="md:hidden space-y-3">
        {!loading && patients.length === 0 && (
          <div className="bg-white rounded-xl border border-[var(--color-border-soft)] p-4 text-center text-slate-muted">
            No patients yet. Add the first one to get started.
          </div>
        )}
        {patients.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/patients/${p.id}`)}
            className="bg-white rounded-xl border border-[var(--color-border-soft)] p-4 hover:bg-[var(--color-clinic-orange-tint)] cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="font-medium text-slate-text">{p.full_name}</div>
              <div className="text-sm text-slate-muted">{new Date(p.created_at).toLocaleDateString()}</div>
            </div>
            <div className="text-sm text-slate-muted mt-2">Case note no.: {p.case_note_number ?? '—'}</div>
            <div className="text-sm text-slate-muted mt-2">Clinic: {locations.find((location) => location.id === p.location_id)?.name ?? '—'}</div>
            <div className="text-sm text-slate-muted mt-2">{p.phone ?? '—'}</div>
            <div className="text-sm text-slate-muted mt-2">DOB: {p.date_of_birth ?? '—'}</div>
          </div>
        ))}
      </div>

      {showModal && (
        <AddPatientModal
          locationId={selectedLocationId}
          locations={locations}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false)
            refetch()
          }}
        />
      )}
      {showImport && (
        <ImportPatientsModal
          locationId={selectedLocationId}
          locations={locations}
          onClose={() => setShowImport(false)}
          onImported={() => {
            setShowImport(false)
            refetch()
          }}
        />
      )}
    </div>
  )
}

type ImportRow = {
  full_name: string
  case_note_number: string
  date_of_birth: string | null
  phone: string | null
  email: string | null
  address: string | null
  gender: string | null
}

const HEADER_ALIASES: Record<keyof ImportRow, string[]> = {
  full_name: ['full name', 'name', 'patient name'],
  case_note_number: ['paper case note number', 'case note number', 'case number', 'file number'],
  date_of_birth: ['date of birth', 'dob', 'birth date'],
  phone: ['phone', 'phone number', 'mobile', 'mobile number'],
  email: ['email', 'email address'],
  address: ['address', 'home address'],
  gender: ['gender', 'sex'],
}

function normalizeHeader(value: unknown) {
  return String(value ?? '').trim().toLowerCase().replace(/[_-]+/g, ' ').replace(/\s+/g, ' ')
}

function cellText(value: unknown) {
  return value == null ? '' : String(value).trim()
}

function formatDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10)
  }
  const text = cellText(value)
  if (!text) return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text
  const parsed = new Date(text)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
}

function ImportPatientsModal({
  locationId,
  locations,
  onClose,
  onImported,
}: {
  locationId: string | null
  locations: ClinicLocation[]
  onClose: () => void
  onImported: () => void
}) {
  const { staff } = useAuth()
  const [rows, setRows] = useState<ImportRow[]>([])
  const [targetLocationId, setTargetLocationId] = useState(locationId ?? locations[0]?.id ?? '')
  const [fileName, setFileName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleFile(file?: File) {
    setRows([])
    setFileName('')
    setError(null)
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setError('Choose an Excel .xlsx file.')
      return
    }

    try {
      const workbook = await readXlsxFile(file)
      const sheet = workbook[0]?.data
      if (!sheet || sheet.length < 2) {
        setError('The spreadsheet needs a header row and at least one patient row.')
        return
      }
      const headers = sheet[0].map(normalizeHeader)
      const columns = Object.fromEntries(
        Object.entries(HEADER_ALIASES).map(([field, aliases]) => [
          field,
          headers.findIndex((header) => aliases.includes(header)),
        ]),
      ) as Record<keyof ImportRow, number>

      if (columns.full_name < 0 || columns.case_note_number < 0) {
        setError('Required columns are Full name and Paper case note number.')
        return
      }

      const parsedRows = sheet.slice(1).map((cells) => ({
        full_name: cellText(cells[columns.full_name]),
        case_note_number: cellText(cells[columns.case_note_number]),
        date_of_birth: columns.date_of_birth < 0 ? null : formatDate(cells[columns.date_of_birth]),
        phone: columns.phone < 0 ? null : cellText(cells[columns.phone]) || null,
        email: columns.email < 0 ? null : cellText(cells[columns.email]) || null,
        address: columns.address < 0 ? null : cellText(cells[columns.address]) || null,
        gender: columns.gender < 0 ? null : cellText(cells[columns.gender]) || null,
      })).filter((row) => row.full_name || row.case_note_number)

      if (parsedRows.length === 0) {
        setError('No patient rows were found in this spreadsheet.')
        return
      }
      setRows(parsedRows)
      setFileName(file.name)
    } catch {
      setError('Could not read this spreadsheet. Check that it is a valid .xlsx file.')
    }
  }

  const seenNumbers = new Set<string>()
  const duplicateNumbers = new Set<string>()
  for (const row of rows) {
    const normalizedNumber = row.case_note_number.trim().toLowerCase()
    if (normalizedNumber && seenNumbers.has(normalizedNumber)) duplicateNumbers.add(normalizedNumber)
    if (normalizedNumber) seenNumbers.add(normalizedNumber)
  }
  const invalidCount = rows.filter((row) => !row.full_name || !row.case_note_number).length
  const duplicateCount = rows.filter((row) => duplicateNumbers.has(row.case_note_number.trim().toLowerCase())).length
  const canImport = rows.length > 0 && invalidCount === 0 && duplicateCount === 0 && !!targetLocationId

  async function handleImport() {
    if (!canImport) return
    setSubmitting(true)
    setError(null)
    const { error: insertError } = await createPatients(rows.map((row) => ({
      ...row,
      created_by: staff?.id ?? null,
      location_id: targetLocationId,
    })))
    setSubmitting(false)
    if (insertError) {
      setError(insertError.message.includes('patients_location_case_note_number_uidx')
        ? 'A paper case note number already exists for this clinic.'
        : insertError.message)
      return
    }
    onImported()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4 py-6">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-full overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display font-semibold text-lg">Import Patients</h2>
            <p className="text-sm text-slate-muted mt-1">Upload an Excel workbook (.xlsx) to add existing records.</p>
          </div>
          <button onClick={onClose} aria-label="Close import dialog" className="text-slate-muted hover:text-slate-text">
            <X size={20} />
          </button>
        </div>

        <div className="mb-3">
          <label htmlFor="import-patient-location" className="mb-1 block text-sm font-medium">Clinic location</label>
          <select
            id="import-patient-location"
            value={targetLocationId}
            onChange={(event) => setTargetLocationId(event.target.value)}
            className="w-full rounded-lg border border-[var(--color-border-soft)] bg-white px-3 py-2 text-sm"
          >
            <option value="">Select a clinic</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </div>

        <label className="flex items-center justify-center gap-2 border border-dashed border-[var(--color-border-soft)] rounded-lg px-4 py-5 cursor-pointer hover:border-[var(--color-clinic-orange)]">
          <Upload size={17} className="text-[var(--color-clinic-orange)]" />
          <span className="text-sm font-medium">{fileName || 'Choose Excel spreadsheet'}</span>
          <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => void handleFile(event.target.files?.[0])} />
        </label>

        <p className="text-xs text-slate-muted mt-3">
          Required columns: Full name, Paper case note number. Optional: Date of birth, Phone, Email, Address, Gender.
        </p>

        {rows.length > 0 && (
          <>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm mt-4">
              <span>{rows.length} patient rows</span>
              {invalidCount > 0 && <span className="text-red-600">{invalidCount} missing required values</span>}
              {duplicateCount > 0 && <span className="text-red-600">{duplicateCount} duplicate paper numbers</span>}
            </div>
            <div className="overflow-auto max-h-64 border border-[var(--color-border-soft)] rounded-lg mt-3">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-slate-muted">
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Paper case note no.</th>
                    <th className="px-3 py-2 font-medium">DOB</th>
                    <th className="px-3 py-2 font-medium">Phone</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={`${index}-${row.case_note_number}`} className="border-t border-[var(--color-border-soft)]">
                      <td className="px-3 py-2">{row.full_name || <span className="text-red-600">Missing</span>}</td>
                      <td className="px-3 py-2">{row.case_note_number || <span className="text-red-600">Missing</span>}</td>
                      <td className="px-3 py-2">{row.date_of_birth ?? '—'}</td>
                      <td className="px-3 py-2">{row.phone ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {!targetLocationId && <p className="text-sm text-red-600 mt-3">Select a clinic location before importing patients.</p>}
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-muted hover:bg-gray-100">
            Cancel
          </button>
          <button
            onClick={() => void handleImport()}
            disabled={!canImport || submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white disabled:opacity-60"
          >
            {submitting ? 'Importing…' : `Import ${rows.length || ''} patients`}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddPatientModal({ onClose, onCreated, locationId, locations }: { onClose: () => void; onCreated: () => void; locationId: string | null; locations: ClinicLocation[] }) {
  const { staff } = useAuth()
  const [fullName, setFullName] = useState('')
  const [caseNoteNumber, setCaseNoteNumber] = useState('')
  const [targetLocationId, setTargetLocationId] = useState(locationId ?? locations[0]?.id ?? '')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }
    if (!caseNoteNumber.trim()) {
      setError('Paper case note number is required.')
      return
    }
    if (!targetLocationId) {
      setError('Choose a clinic location.')
      return
    }
    setSubmitting(true)
    const { error } = await createPatient({
      full_name: fullName.trim(),
      case_note_number: caseNoteNumber.trim(),
      date_of_birth: dob || null,
      phone: phone || null,
      created_by: staff?.id ?? null,
      location_id: targetLocationId,
    })
    setSubmitting(false)
    if (error) setError(error.message)
    else onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-lg">Add Patient</h2>
          <button onClick={onClose} className="text-slate-muted hover:text-slate-text">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Full name</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Paper case note number</label>
            <input
              value={caseNoteNumber}
              onChange={(e) => setCaseNoteNumber(e.target.value)}
              required
              autoComplete="off"
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label htmlFor="new-patient-location" className="block text-sm font-medium mb-1">Clinic location</label>
            <select
              id="new-patient-location"
              value={targetLocationId}
              onChange={(e) => setTargetLocationId(e.target.value)}
              required
              className="w-full rounded-lg border border-[var(--color-border-soft)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            >
              <option value="">Select a clinic</option>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Date of birth</label>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-soft)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-clinic-orange)]"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-slate-muted hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-clinic-orange)] hover:bg-[var(--color-clinic-orange-dark)] text-white disabled:opacity-60"
          >
            {submitting ? 'Saving…' : 'Save patient'}
          </button>
        </div>
      </div>
    </div>
  )
}
