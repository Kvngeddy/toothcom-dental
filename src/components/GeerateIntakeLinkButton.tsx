import { useState } from "react";
import { Link2, Check } from "lucide-react";
import { supabase } from "../lib/supabaseClient"; // adjust path to match your project

export function GenerateIntakeLinkButton({ patientId }: { patientId: string }) {
  const [generating, setGenerating] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc(
      "generate_intake_token",
      { p_patient_id: patientId, p_days_valid: 7 }
    );
    setGenerating(false);

    if (rpcError || !data) {
      setError(rpcError?.message ?? "Could not generate link.");
      return;
    }

    const url = `${window.location.origin}/intake/${data as string}`;
    setLink(url);
    setCopied(false);
  }

  async function handleCopy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      <button
        onClick={() => void handleGenerate()}
        disabled={generating}
        className="flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 disabled:opacity-60"
      >
        <Link2 size={16} />
        {generating ? "Generating..." : "Generate Intake Link"}
      </button>

      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {link && (
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
          <input
            readOnly
            value={link}
            className="flex-1 bg-transparent text-sm text-gray-600 outline-none"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={() => void handleCopy()}
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50"
          >
            {copied ? <Check size={14} /> : <Link2 size={14} />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      
    </div>
  );
}