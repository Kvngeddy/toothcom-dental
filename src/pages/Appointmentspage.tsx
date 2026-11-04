import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { useLocation } from "@/contexts/LocationContext";

type Patient = { id: string; full_name: string };
type Staff = { id: string; full_name: string };
type ServiceOption = { id: string; name: string; category: string };
type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled";

type Appointment = {
  id: string;
  patient_id: string;
  staff_id: string;
  service_id: string | null;
  scheduled_at: string;
  reason: string | null;
  status: AppointmentStatus;
  patients?: Patient;
  staff?: Staff;
  services?: string[];
};

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};

function localDateKey(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function AppointmentsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedLocationId } = useLocation();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [showBookModal, setShowBookModal] = useState(false);
  const [statusEditId, setStatusEditId] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setShowBookModal(true);
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const loadAll = useCallback(async () => {
    if (!selectedLocationId) {
      setAppointments([]);
      setPatients([]);
      setStaff([]);
      setServices([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: appts, error: apptError }, { data: pts }, { data: stf }, { data: svcs }] =
      await Promise.all([
        supabase
          .from("appointments")
          .select("*, patients(id, full_name), staff(id, full_name)")
          .eq("location_id", selectedLocationId)
          .order("scheduled_at", { ascending: true }),
        supabase.from("patients").select("id, full_name").eq("location_id", selectedLocationId),
        supabase.from("staff").select("id, full_name").eq("location_id", selectedLocationId),
        supabase.from("services").select("id, name, category").eq("is_active", true),
      ]);

    if (apptError) console.error("Failed to load appointments:", apptError.message);

    const appointmentRows = (appts as Appointment[]) ?? [];
    const { data: appointmentServices } = appointmentRows.length
      ? await supabase
          .from("appointment_services")
          .select("appointment_id, service_id")
          .in("appointment_id", appointmentRows.map((appointment) => appointment.id))
      : { data: [] };
    const serviceNames = new Map((svcs ?? []).map((service) => [service.id, service.name]));
    const serviceIdsByAppointment = new Map<string, string[]>();
    for (const row of appointmentServices ?? []) {
      const ids = serviceIdsByAppointment.get(row.appointment_id) ?? [];
      ids.push(row.service_id);
      serviceIdsByAppointment.set(row.appointment_id, ids);
    }
    setAppointments(appointmentRows.map((appointment) => {
      const serviceIds = serviceIdsByAppointment.get(appointment.id)
        ?? (appointment.service_id ? [appointment.service_id] : []);
      return {
        ...appointment,
        services: serviceIds.flatMap((id) => {
          const name = serviceNames.get(id);
          return name ? [name] : [];
        }),
      };
    }));
    setPatients((pts as Patient[]) ?? []);
    setStaff((stf as Staff[]) ?? []);
    setServices((svcs as ServiceOption[]) ?? []);
    setLoading(false);
  }, [selectedLocationId]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  async function updateStatus(id: string, status: AppointmentStatus) {
    const { error } = await supabase
      .from("appointments")
      .update({ status })
      .eq("id", id);
    if (!error) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a))
      );
    }
    setStatusEditId(null);
  }

  const filtered = appointments.filter((appointment) => {
    const patientMatches = (appointment.patients?.full_name ?? "")
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    const appointmentDate = localDateKey(appointment.scheduled_at);
    return patientMatches
      && (!dateFrom || appointmentDate >= dateFrom)
      && (!dateTo || appointmentDate <= dateTo);
  });

  return (
    <div>
   <div className="mb-4 mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
  <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
  <button
    onClick={() => setShowBookModal(true)}
    className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-none bg-orange-500 px-4 py-2 text-white font-medium transition hover:bg-orange-600 md:w-auto"
  >
    <Plus size={16} aria-hidden="true" />
    <span>Book Appointment</span>
  </button>
</div>
      <p className="mb-4 text-gray-500">
        {appointments.length} appointment{appointments.length !== 1 && "s"} scheduled
      </p>

      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(16rem,1fr)_repeat(2,minmax(10rem,12rem))_auto] md:items-end">
        <div>
          <label htmlFor="appointment-patient-search" className="mb-1 block text-xs font-medium text-gray-600">Patient</label>
          <input
            id="appointment-patient-search"
            type="search"
            placeholder="Search by patient name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label htmlFor="appointment-date-from" className="mb-1 block text-xs font-medium text-gray-600">From date</label>
          <input
            id="appointment-date-from"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <div>
          <label htmlFor="appointment-date-to" className="mb-1 block text-xs font-medium text-gray-600">To date</label>
          <input
            id="appointment-date-to"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        {(dateFrom || dateTo) && (
          <button
            onClick={() => {
              setDateFrom("");
              setDateTo("");
            }}
            className="min-h-10 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            Clear dates
          </button>
        )}
      </div>

      <div className="hidden md:block overflow-hidden rounded-lg border border-gray-200">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-4 py-3">Date / Time</th>
              <th className="px-4 py-3">Patient</th>
              <th className="px-4 py-3">Staff</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                  No appointments found.
                </td>
              </tr>
            )}
            {filtered.map((a) => (
              <tr key={a.id} className="border-t border-gray-100">
                <td className="px-4 py-3">
                  {new Date(a.scheduled_at).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">
                  {a.patients?.full_name ?? "—"}
                </td>
                <td className="px-4 py-3">{a.staff?.full_name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{a.services?.join(", ") || "—"}</td>
                <td className="px-4 py-3 text-gray-500">{a.reason ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[a.status]}`}
                  >
                    {a.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setStatusEditId(a.id)}
                    className="text-orange-600 hover:underline font-medium"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {loading && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-gray-400">Loading...</div>
        )}
        {!loading && filtered.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-4 text-center text-gray-400">No appointments found.</div>
        )}
        {filtered.map((a) => (
          <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="font-medium text-gray-900">{a.patients?.full_name ?? '—'}</div>
              <div className="text-sm text-gray-500">{new Date(a.scheduled_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>
            </div>
            <div className="text-sm text-gray-500 mt-2">Staff: {a.staff?.full_name ?? '—'}</div>
            <div className="text-sm text-gray-500 mt-2">Services: {a.services?.join(", ") || '—'}</div>
            <div className="text-sm text-gray-500 mt-2">Reason: {a.reason ?? '—'}</div>
            <div className="mt-3 flex items-center justify-between">
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[a.status]}`}>{a.status}</span>
              <button onClick={() => setStatusEditId(a.id)} className="text-orange-600 hover:underline font-medium">Edit</button>
            </div>
          </div>
        ))}
      </div>

      {showBookModal && (
        <BookAppointmentModal
          locationId={selectedLocationId}
          patients={patients}
          staff={staff}
          services={services}
          onClose={() => setShowBookModal(false)}
          onBooked={() => {
            setShowBookModal(false);
            void loadAll();
          }}
        />
      )}

      {statusEditId && (
        <UpdateStatusModal
          appointment={appointments.find((a) => a.id === statusEditId)!}
          onCancel={() => setStatusEditId(null)}
          onUpdate={(status) => void updateStatus(statusEditId, status)}
        />
      )}
    </div>
  );
}

function BookAppointmentModal({
  locationId,
  patients,
  staff,
  services,
  onClose,
  onBooked,
}: {
  locationId: string | null;
  patients: Patient[];
  staff: Staff[];
  services: ServiceOption[];
  onClose: () => void;
  onBooked: () => void;
}) {
  const [patientId, setPatientId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [scheduledAt, setScheduledAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!patientId || !staffId || serviceIds.length === 0 || !scheduledAt) {
      setError("Patient, staff, at least one service, and date/time are required.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data: appointment, error: insertError } = await supabase.from("appointments").insert({
      patient_id: patientId,
      staff_id: staffId,
      service_id: serviceIds[0],
      scheduled_at: new Date(scheduledAt).toISOString(),
      reason: reason || null,
      status: "pending",
      location_id: locationId,
    }).select("id").single();
    if (!insertError && appointment) {
      const { error: servicesError } = await supabase.from("appointment_services").insert(
        serviceIds.map((serviceId) => ({ appointment_id: appointment.id, service_id: serviceId }))
      );
      if (servicesError) {
        await supabase.from("appointments").delete().eq("id", appointment.id);
        setSaving(false);
        setError(servicesError.message);
        return;
      }
    }
    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    onBooked();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="max-h-[calc(100dvh-2rem)] w-full max-w-md overflow-y-auto rounded-xl bg-white p-5 shadow-xl sm:p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          Book Appointment
        </h2>

        {error && (
          <p className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Patient</label>
            <select
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Dentist / Staff</label>
            <select
              value={staffId}
              onChange={(e) => setStaffId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">Select staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <fieldset>
              <legend className="mb-1 block text-sm font-medium text-gray-700">Services</legend>
              <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg border border-gray-200 p-2">
                {services.map((service) => (
                  <label key={service.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 py-1 text-sm text-gray-700 hover:bg-orange-50">
                    <input
                      type="checkbox"
                      checked={serviceIds.includes(service.id)}
                      onChange={(event) => setServiceIds((current) => event.target.checked
                        ? [...current, service.id]
                        : current.filter((id) => id !== service.id))}
                      className="size-4 accent-orange-600"
                    />
                    <span>{service.category} — {service.name}</span>
                  </label>
                ))}
                {services.length === 0 && <p className="px-2 py-2 text-sm text-gray-500">No services available.</p>}
              </div>
            </fieldset>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Date & Time</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Reason</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button
            onClick={() => void handleSave()}
            disabled={saving}
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {saving ? "Booking..." : "Book Appointment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UpdateStatusModal({
  appointment,
  onCancel,
  onUpdate,
}: {
  appointment: Appointment;
  onCancel: () => void;
  onUpdate: (status: AppointmentStatus) => void;
}) {
  const [status, setStatus] = useState<AppointmentStatus>(appointment.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-3 text-lg font-semibold text-gray-900">Update Status</h2>
        <div className="mb-4 space-y-1 text-sm text-gray-600">
          <p><span className="font-medium text-gray-800">Patient:</span> {appointment.patients?.full_name}</p>
          <p><span className="font-medium text-gray-800">Staff:</span> {appointment.staff?.full_name}</p>
          <p><span className="font-medium text-gray-800">Date:</span> {new Date(appointment.scheduled_at).toLocaleString()}</p>
        </div>

        <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as AppointmentStatus)}
          className="mb-5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={() => onUpdate(status)} className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
            Update Status
          </button>
        </div>
      </div>
    </div>
  );
}