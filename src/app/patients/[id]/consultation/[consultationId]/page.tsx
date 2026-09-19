"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { patientService } from "@/features/patients/patientService";
import { useAuth } from "@/features/auth/AuthContext";
import { Consultation, MedicineInstruction } from "@/types";
import { ArrowLeft, Loader2, AlertTriangle, CheckCircle2, Edit3, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function ConsultationReviewPage() {
  const { id: patientId, consultationId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [medicines, setMedicines] = useState<MedicineInstruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  
  const [editingMedId, setEditingMedId] = useState<string | null>(null);

  useEffect(() => {
    if (patientId && consultationId) {
      loadConsultation(patientId as string, consultationId as string);
    }
  }, [patientId, consultationId]);

  const loadConsultation = async (pId: string, cId: string) => {
    try {
      const data = await patientService.getConsultationById(pId, cId);
      if (data) {
        setConsultation(data);
        setMedicines(data.medicines || []);
      } else {
        setError("Consultation not found.");
      }
    } catch (err) {
      setError("Failed to load consultation data.");
    } finally {
      setLoading(false);
    }
  };

  const handleMedicineChange = (medId: string, field: keyof MedicineInstruction, value: string) => {
    setMedicines(prev => prev.map(m => m.id === medId ? { ...m, [field]: value } : m));
  };

  const saveEdit = async () => {
    const newStatus = consultation?.status === "DOCTOR_VERIFIED" ? "NEEDS_REVIEW" : consultation?.status || "DRAFT";
    try {
      await patientService.updateConsultation(patientId as string, consultationId as string, {
        medicines,
        status: newStatus
      });
      setConsultation(prev => prev ? { ...prev, status: newStatus } : null);
      setEditingMedId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to save edit.");
    }
  };

  const handleVerify = async () => {
    if (!user) return;
    setVerifying(true);
    try {
      await patientService.updateConsultation(patientId as string, consultationId as string, {
        status: "DOCTOR_VERIFIED",
        medicines,
        verifiedAt: Date.now(),
        verifiedBy: user.uid,
      });
      
      // Bind device to patient & hand off to Patient Mode
      localStorage.setItem("arogya_patient_id", patientId as string);
      router.replace("/patient");
    } catch (err) {
      setVerifying(false);
      alert("Verification failed. Please try again.");
    }
  };

  const isValid = medicines.every(m => m.medicineName && m.dose && m.timing && m.duration);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600 w-8 h-8"/></div>;
  if (error || !consultation) return <div className="p-4 text-red-600">{error}</div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-32">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => router.back()} className="p-2 -ml-2 mr-2 text-gray-600 hover:text-gray-900 rounded-full">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-900">Review & Verify</h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 text-blue-800 p-4 rounded-xl flex items-start space-x-3">
            <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-blue-600" />
            <div>
              <p className="font-semibold text-blue-900 tracking-wide text-sm">AI-GENERATED DRAFT</p>
              <p className="text-sm mt-1">Please review the extracted information before verifying for the patient.</p>
            </div>
          </div>

          {medicines.map((med, index) => {
            const isEditing = editingMedId === med.id;
            const hasMissingFields = !med.medicineName || !med.dose || !med.timing || !med.duration;

            return (
              <Card key={med.id} className="relative overflow-hidden">
                <div className="flex justify-between items-center mb-4 border-b pb-3">
                  <h2 className="font-bold text-gray-800 text-lg">Medicine {index + 1}</h2>
                  {!isEditing ? (
                    <button onClick={() => setEditingMedId(med.id)} className="text-blue-600 flex items-center text-sm font-medium hover:text-blue-800 p-2 bg-blue-50 rounded-lg">
                      <Edit3 size={16} className="mr-1" /> Edit
                    </button>
                  ) : (
                    <button onClick={saveEdit} className="text-green-600 flex items-center text-sm font-medium hover:text-green-800 p-2 bg-green-50 rounded-lg">
                      <Save size={16} className="mr-1" /> Save
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  <FieldRow label="Medicine" value={med.medicineName} isEditing={isEditing} onChange={(v: string) => handleMedicineChange(med.id, 'medicineName', v)} />
                  <FieldRow label="Dose" value={med.dose} isEditing={isEditing} onChange={(v: string) => handleMedicineChange(med.id, 'dose', v)} />
                  <FieldRow label="Timing" value={med.timing} isEditing={isEditing} onChange={(v: string) => handleMedicineChange(med.id, 'timing', v)} />
                  <FieldRow label="Food Condition" value={med.foodCondition} isEditing={isEditing} onChange={(v: string) => handleMedicineChange(med.id, 'foodCondition', v)} optional />
                  <FieldRow label="Duration" value={med.duration} isEditing={isEditing} onChange={(v: string) => handleMedicineChange(med.id, 'duration', v)} />
                </div>

                {hasMissingFields && !isEditing && (
                  <div className="mt-4 pt-3 border-t border-amber-100 flex items-center text-amber-700 bg-amber-50 -mx-5 px-5 pb-5 -mb-5">
                    <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
                    <span className="text-sm font-medium">Missing required fields. Please edit to complete.</span>
                  </div>
                )}
              </Card>
            );
          })}
        </main>

        <div className="fixed bottom-0 w-full bg-white border-t p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto">
            {!isValid && (
              <p className="text-center text-sm text-red-600 font-medium mb-2">
                Resolve all missing information to verify
              </p>
            )}
            <Button
              fullWidth
              size="large"
              onClick={handleVerify}
              disabled={!isValid || verifying || editingMedId !== null}
              className={`py-5 text-lg ${isValid ? "bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-lg shadow-green-200" : ""}`}
            >
              DOCTOR VERIFIED — SET REMINDERS
            </Button>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

function FieldRow({ label, value, isEditing, onChange, optional = false }: { label: string, value: string | null, isEditing: boolean, onChange: (v: string) => void, optional?: boolean }) {
  const isMissing = !value && !optional;
  return (
    <div>
      <span className="text-sm text-gray-500 block mb-1 font-medium">{label}</span>
      {isEditing ? (
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={optional ? "Unspecified" : "Required"}
          className={`w-full p-3 border rounded-xl focus:ring-2 focus:outline-none ${isMissing ? 'border-red-300 bg-red-50 focus:ring-red-500' : 'border-gray-200 focus:ring-blue-500 bg-gray-50'}`}
        />
      ) : (
        <div className={`font-semibold text-lg ${isMissing ? 'text-amber-600 flex items-center bg-amber-50 p-2 rounded-lg -ml-2' : 'text-gray-900'}`}>
          {isMissing && <AlertTriangle className="w-5 h-5 mr-2 inline" />}
          {value || (optional ? <span className="text-gray-400 font-normal italic">Unspecified</span> : "⚠ NEEDS INPUT")}
        </div>
      )}
    </div>
  );
}
