import { useState } from "react";

// ---------------- Types ----------------
export type RegistrationValues = {
  sex: "male" | "female" | "other" | "";
  homeAddress: string;
  occupation: string;
  officeAddress: string;
  email: string;
  maritalStatus: string;
  officePhone: string;
  whatsappNo: string;
  nextOfKinName: string;
  nextOfKinAddress: string;
  nextOfKinPhone: string;
};

export type MedicalHistoryValues = {
  physician: string;
  physicianPhone: string;
  lastExamDate: string;
  underTreatment: boolean | null;
  underTreatmentNote: string;
  hospitalized: boolean | null;
  hospitalizedReason: string;
  drugAllergy: boolean | null;
  drugAllergyDetail: string;
  lastPhysical: string;
  usesTobacco: boolean | null;
  usesAlcohol: boolean | null;
  wearsContactLens: boolean | null;
  isPregnant: boolean | null;
  isNursing: boolean | null;
  takesBirthControl: boolean | null;
  conditions: string[];
  conditionsOther: string;
};

export type DentalHistoryValues = {
  bleedingGums: boolean | null;
  sensitivityHotCold: boolean | null;
  sensitivitySweetSour: boolean | null;
  toothPain: boolean | null;
  soresOrLumps: boolean | null;
  headNeckJawInjury: boolean | null;
  jawPain: boolean;
  jawClicking: boolean;
  difficultyChewing: boolean;
  difficultyOpeningClosing: boolean;
  grindsTeeth: boolean | null;
  bitesLipsCheeks: boolean | null;
  difficultExtractions: boolean | null;
  orthodonticTreatment: boolean | null;
  prolongedBleeding: boolean | null;
  teethWhitening: boolean | null;
  hasImplants: boolean | null;
  othersNote: string;
};

export type IntakePayload = {
  registration: RegistrationValues;
  medicalHistory: MedicalHistoryValues;
  dentalHistory: DentalHistoryValues;
  consentName: string;
};

const CONDITIONS = [
  "High blood pressure", "Low blood pressure", "Stroke", "Rheumatic fever",
  "Cardiac pacemaker", "Heart murmur", "Angina", "Radiation therapy",
  "Diabetes", "Liver disorder", "Bleeding disorder", "Arthritis",
  "Implants", "Recent weight loss", "Easily winded", "Frequently tired",
  "Fainting/seizure", "Epilepsy/convulsions", "Asthma", "Chest pain",
  "Emphysema", "Glaucoma", "Abdominal disorder", "Ulcer",
  "Hepatitis/jaundice", "HIV/AIDS infection", "Tuberculosis", "Leukemia",
  "Cancer", "Anemia", "Breathlessness", "Allergies",
];

const emptyRegistration: RegistrationValues = {
  sex: "", homeAddress: "", occupation: "", officeAddress: "", email: "",
  maritalStatus: "", officePhone: "", whatsappNo: "", nextOfKinName: "",
  nextOfKinAddress: "", nextOfKinPhone: "",
};

const emptyMedical: MedicalHistoryValues = {
  physician: "", physicianPhone: "", lastExamDate: "", underTreatment: null,
  underTreatmentNote: "", hospitalized: null, hospitalizedReason: "",
  drugAllergy: null, drugAllergyDetail: "", lastPhysical: "",
  usesTobacco: null, usesAlcohol: null, wearsContactLens: null,
  isPregnant: null, isNursing: null, takesBirthControl: null,
  conditions: [], conditionsOther: "",
};

const emptyDental: DentalHistoryValues = {
  bleedingGums: null, sensitivityHotCold: null, sensitivitySweetSour: null,
  toothPain: null, soresOrLumps: null, headNeckJawInjury: null,
  jawPain: false, jawClicking: false, difficultyChewing: false,
  difficultyOpeningClosing: false, grindsTeeth: null, bitesLipsCheeks: null,
  difficultExtractions: null, orthodonticTreatment: null,
  prolongedBleeding: null, teethWhitening: null, hasImplants: null,
  othersNote: "",
};

// ---------------- Small building blocks ----------------
function TextField({
  label, value, onChange, type = "text", required = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
      />
    </div>
  );
}

function YesNo({
  label, value, onChange,
}: {
  label: string; value: boolean | null; onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <p className="text-sm text-gray-700">{label}</p>
      <div className="flex shrink-0 gap-2">
        {(["Yes", "No"] as const).map((opt) => {
          const boolVal = opt === "Yes";
          const selected = value === boolVal;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(boolVal)}
              className={`rounded-md px-3 py-1 text-xs font-medium border transition ${
                selected
                  ? "bg-orange-500 text-white border-orange-500"
                  : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepHeader({ title, step, total }: { title: string; step: number; total: number }) {
  return (
    <div className="mb-5">
      <p className="mb-1 text-xs font-medium text-orange-500">
        Step {step} of {total}
      </p>
      <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 h-1.5 w-full rounded-full bg-gray-100">
        <div
          className="h-1.5 rounded-full bg-orange-500 transition-all"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>
    </div>
  );
}

// ---------------- Main wizard ----------------
export function PatientIntakeForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (payload: IntakePayload) => void;
  submitting?: boolean;
}) {
  const [step, setStep] = useState(1);
  const totalSteps = 4;

  const [registration, setRegistration] = useState<RegistrationValues>(emptyRegistration);
  const [medical, setMedical] = useState<MedicalHistoryValues>(emptyMedical);
  const [dental, setDental] = useState<DentalHistoryValues>(emptyDental);
  const [consentName, setConsentName] = useState("");
  const [consentChecked, setConsentChecked] = useState(false);

  function next() { setStep((s) => Math.min(s + 1, totalSteps)); }
  function back() { setStep((s) => Math.max(s - 1, 1)); }

  function toggleCondition(name: string) {
    setMedical((m) => ({
      ...m,
      conditions: m.conditions.includes(name)
        ? m.conditions.filter((c) => c !== name)
        : [...m.conditions, name],
    }));
  }

  function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consentName.trim() || !consentChecked) return;
    onSubmit({ registration, medicalHistory: medical, dentalHistory: dental, consentName });
  }

  return (
    <div>
      {step === 1 && (
        <div>
          <StepHeader title="Registration" step={1} total={totalSteps} />
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Sex</label>
              <select
                value={registration.sex}
                onChange={(e) => setRegistration({ ...registration, sex: e.target.value as RegistrationValues["sex"] })}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <TextField label="Home address" value={registration.homeAddress} onChange={(v) => setRegistration({ ...registration, homeAddress: v })} />
            <TextField label="Occupation" value={registration.occupation} onChange={(v) => setRegistration({ ...registration, occupation: v })} />
            <TextField label="Office address" value={registration.officeAddress} onChange={(v) => setRegistration({ ...registration, officeAddress: v })} />
            <TextField label="Email address" type="email" value={registration.email} onChange={(v) => setRegistration({ ...registration, email: v })} />
            <TextField label="Marital status" value={registration.maritalStatus} onChange={(v) => setRegistration({ ...registration, maritalStatus: v })} />
            <TextField label="Office phone" value={registration.officePhone} onChange={(v) => setRegistration({ ...registration, officePhone: v })} />
            <TextField label="WhatsApp number" value={registration.whatsappNo} onChange={(v) => setRegistration({ ...registration, whatsappNo: v })} />
            <hr className="my-2 border-gray-100" />
            <p className="text-sm font-medium text-gray-800">Next of kin</p>
            <TextField label="Name" value={registration.nextOfKinName} onChange={(v) => setRegistration({ ...registration, nextOfKinName: v })} />
            <TextField label="Address" value={registration.nextOfKinAddress} onChange={(v) => setRegistration({ ...registration, nextOfKinAddress: v })} />
            <TextField label="Phone" value={registration.nextOfKinPhone} onChange={(v) => setRegistration({ ...registration, nextOfKinPhone: v })} />
          </div>
          <button
            type="button"
            onClick={next}
            className="mt-6 w-full rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600"
          >
            Continue
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <StepHeader title="Medical history" step={2} total={totalSteps} />
          <div className="space-y-3">
            <TextField label="Physician's name" value={medical.physician} onChange={(v) => setMedical({ ...medical, physician: v })} />
            <TextField label="Physician's office phone" value={medical.physicianPhone} onChange={(v) => setMedical({ ...medical, physicianPhone: v })} />
            <TextField label="Date of last exam" type="date" value={medical.lastExamDate} onChange={(v) => setMedical({ ...medical, lastExamDate: v })} />

            <div className="divide-y divide-gray-100">
              <YesNo label="Are you under medical treatment now?" value={medical.underTreatment} onChange={(v) => setMedical({ ...medical, underTreatment: v })} />
              {medical.underTreatment && (
                <TextField label="Please specify" value={medical.underTreatmentNote} onChange={(v) => setMedical({ ...medical, underTreatmentNote: v })} />
              )}
              <YesNo label="Have you ever been hospitalized?" value={medical.hospitalized} onChange={(v) => setMedical({ ...medical, hospitalized: v })} />
              {medical.hospitalized && (
                <TextField label="Why?" value={medical.hospitalizedReason} onChange={(v) => setMedical({ ...medical, hospitalizedReason: v })} />
              )}
              <YesNo label="Are you allergic to, or have you had reactions to, any drugs?" value={medical.drugAllergy} onChange={(v) => setMedical({ ...medical, drugAllergy: v })} />
              {medical.drugAllergy && (
                <TextField label="Please specify" value={medical.drugAllergyDetail} onChange={(v) => setMedical({ ...medical, drugAllergyDetail: v })} />
              )}
            </div>

            <TextField label="When was your last physical?" value={medical.lastPhysical} onChange={(v) => setMedical({ ...medical, lastPhysical: v })} />

            <div className="divide-y divide-gray-100">
              <YesNo label="Do you use tobacco?" value={medical.usesTobacco} onChange={(v) => setMedical({ ...medical, usesTobacco: v })} />
              <YesNo label="Do you use alcohol?" value={medical.usesAlcohol} onChange={(v) => setMedical({ ...medical, usesAlcohol: v })} />
              <YesNo label="Are you wearing contact lenses?" value={medical.wearsContactLens} onChange={(v) => setMedical({ ...medical, wearsContactLens: v })} />
            </div>

            {registration.sex === "female" && (
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="mb-1 text-xs font-medium text-gray-500">For women only</p>
                <div className="divide-y divide-gray-100">
                  <YesNo label="Are you pregnant, or think you may be?" value={medical.isPregnant} onChange={(v) => setMedical({ ...medical, isPregnant: v })} />
                  <YesNo label="Are you nursing?" value={medical.isNursing} onChange={(v) => setMedical({ ...medical, isNursing: v })} />
                  <YesNo label="Are you taking birth control pills?" value={medical.takesBirthControl} onChange={(v) => setMedical({ ...medical, takesBirthControl: v })} />
                </div>
              </div>
            )}

            <div>
              <p className="mb-2 text-sm font-medium text-gray-700">
                Please check any of the following that applies to you
              </p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                {CONDITIONS.map((c) => (
                  <label key={c} className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={medical.conditions.includes(c)}
                      onChange={() => toggleCondition(c)}
                      className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                    />
                    {c}
                  </label>
                ))}
              </div>
              <div className="mt-2">
                <TextField label="Others (please specify)" value={medical.conditionsOther} onChange={(v) => setMedical({ ...medical, conditionsOther: v })} />
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button type="button" onClick={next} className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <StepHeader title="Dental history" step={3} total={totalSteps} />
          <div className="divide-y divide-gray-100">
            <YesNo label="Do your gums bleed while brushing or flossing?" value={dental.bleedingGums} onChange={(v) => setDental({ ...dental, bleedingGums: v })} />
            <YesNo label="Are your teeth sensitive to hot or cold food/liquid?" value={dental.sensitivityHotCold} onChange={(v) => setDental({ ...dental, sensitivityHotCold: v })} />
            <YesNo label="Are your teeth sensitive to sweet or sour food/liquid?" value={dental.sensitivitySweetSour} onChange={(v) => setDental({ ...dental, sensitivitySweetSour: v })} />
            <YesNo label="Do you feel pain in any of your teeth?" value={dental.toothPain} onChange={(v) => setDental({ ...dental, toothPain: v })} />
            <YesNo label="Do you have any sores or lumps in or near your mouth?" value={dental.soresOrLumps} onChange={(v) => setDental({ ...dental, soresOrLumps: v })} />
            <YesNo label="Have you had any head, neck or jaw injuries?" value={dental.headNeckJawInjury} onChange={(v) => setDental({ ...dental, headNeckJawInjury: v })} />
          </div>

          <div className="mt-3">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Have you ever experienced any of the following jaw problems?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {([
                ["jawPain", "Pain (joint, ear, side of face)"],
                ["jawClicking", "Clicking"],
                ["difficultyChewing", "Difficulty in chewing"],
                ["difficultyOpeningClosing", "Difficulty opening/closing"],
              ] as const).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={dental[key]}
                    onChange={(e) => setDental({ ...dental, [key]: e.target.checked })}
                    className="rounded border-gray-300 text-orange-500 focus:ring-orange-300"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-3 divide-y divide-gray-100">
            <YesNo label="Do you grind your teeth?" value={dental.grindsTeeth} onChange={(v) => setDental({ ...dental, grindsTeeth: v })} />
            <YesNo label="Do you bite your lips or cheeks frequently?" value={dental.bitesLipsCheeks} onChange={(v) => setDental({ ...dental, bitesLipsCheeks: v })} />
            <YesNo label="Have you ever had any difficult extractions?" value={dental.difficultExtractions} onChange={(v) => setDental({ ...dental, difficultExtractions: v })} />
            <YesNo label="Have you ever had any orthodontic treatment?" value={dental.orthodonticTreatment} onChange={(v) => setDental({ ...dental, orthodonticTreatment: v })} />
            <YesNo label="Have you ever had prolonged bleeding after extractions?" value={dental.prolongedBleeding} onChange={(v) => setDental({ ...dental, prolongedBleeding: v })} />
            <YesNo label="Have you ever had teeth whitening done?" value={dental.teethWhitening} onChange={(v) => setDental({ ...dental, teethWhitening: v })} />
            <YesNo label="Do you have implants anywhere?" value={dental.hasImplants} onChange={(v) => setDental({ ...dental, hasImplants: v })} />
          </div>

          <div className="mt-3">
            <TextField label="Others (please specify)" value={dental.othersNote} onChange={(v) => setDental({ ...dental, othersNote: v })} />
          </div>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button type="button" onClick={next} className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 4 && (
        <form onSubmit={handleFinalSubmit}>
          <StepHeader title="Confirm & sign" step={4} total={totalSteps} />
          <p className="mb-4 text-sm text-gray-500">
            I certify that I have read and understand the above information. To
            the best of my knowledge, the above questions have been accurately
            answered. I understand that providing incorrect information can be
            dangerous to my health.
          </p>

          <TextField
            label="Type your full name to sign"
            value={consentName}
            onChange={setConsentName}
            required
          />

          <label className="mt-3 flex items-start gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={consentChecked}
              onChange={(e) => setConsentChecked(e.target.checked)}
              className="mt-0.5 rounded border-gray-300 text-orange-500 focus:ring-orange-300"
            />
            I confirm the information I've provided is accurate.
          </label>

          <div className="mt-6 flex gap-2">
            <button type="button" onClick={back} className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
              Back
            </button>
            <button
              type="submit"
              disabled={submitting || !consentName.trim() || !consentChecked}
              className="flex-1 rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
            >
              {submitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}