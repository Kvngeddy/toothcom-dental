import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabaseClient"; // adjust path to match your project
import { PatientIntakeForm, type IntakePayload } from "./PatientIntakeForm";

type PageState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "expired" }
  | { status: "used" }
  | { status: "ready"; patientName: string }
  | { status: "success" }
  | { status: "error"; message: string };

export default function IntakePage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<PageState>({ status: "loading" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void loadToken();
  }, [token]);

  async function loadToken() {
    if (!token) {
      setState({ status: "invalid" });
      return;
    }
    const { data, error } = await supabase
      .rpc("get_intake_patient", { p_token: token })
      .single();

    if (error || !data) {
      setState({ status: "invalid" });
      return;
    }

    const row = data as {
      valid: boolean;
      expired: boolean;
      used: boolean;
      patient_name: string | null;
    };

    if (!row.valid) {
      setState({ status: "invalid" });
    } else if (row.expired) {
      setState({ status: "expired" });
    } else if (row.used) {
      setState({ status: "used" });
    } else {
      setState({ status: "ready", patientName: row.patient_name ?? "there" });
    }
  }

  async function handleSubmit(payload: IntakePayload) {
    if (!token) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("submit_intake", {
      p_token: token,
      p_registration: payload.registration,
      p_medical_history: payload.medicalHistory,
      p_dental_history: payload.dentalHistory,
      p_consent_name: payload.consentName,
    });
    setSubmitting(false);

    if (error) {
      setState({ status: "error", message: error.message });
      return;
    }
    setState({ status: "success" });
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-sm border border-gray-100">
        <img
          src="/Screenshot 2026-08-31 055944.png"
          alt="Toothcom Dental Clinics"
          className="h-10 w-auto object-contain mb-6"
        />

        {state.status === "loading" && (
          <p className="text-gray-500 text-sm">Loading...</p>
        )}

        {state.status === "invalid" && (
          <StatusMessage
            title="Link not found"
            body="This intake link doesn't look right. Please check the link your clinic sent you, or contact the clinic for a new one."
          />
        )}

        {state.status === "expired" && (
          <StatusMessage
            title="Link expired"
            body="This intake link has expired. Please contact the clinic to request a new one."
          />
        )}

        {state.status === "used" && (
          <StatusMessage
            title="Already submitted"
            body="This intake form has already been completed. If something needs to change, please contact the clinic directly."
          />
        )}

        {state.status === "error" && (
          <StatusMessage title="Something went wrong" body={state.message} />
        )}

        {state.status === "success" && (
          <StatusMessage
            title="Thank you"
            body="Your information has been received. You can close this page now."
          />
        )}

        {state.status === "ready" && (
          <>
            <h1 className="text-lg font-semibold text-gray-900 mb-1">
              Hi {state.patientName}, welcome
            </h1>
            <p className="text-sm text-gray-500 mb-6">
              Please fill in your registration and history details for your
              clinic record. It's split into a few short steps.
            </p>
            <PatientIntakeForm onSubmit={handleSubmit} submitting={submitting} />
          </>
        )}
      </div>
    </div>
  );
}

function StatusMessage({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h1 className="text-lg font-semibold text-gray-900 mb-1">{title}</h1>
      <p className="text-sm text-gray-500">{body}</p>
    </div>
  );
}4