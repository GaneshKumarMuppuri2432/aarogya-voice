"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { patientService } from "@/features/patients/patientService";
import { Patient, Consultation } from "@/types";
import { Volume2, Loader2, LogOut, Sun } from "lucide-react";

export default function PatientHomePage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeConsultation, setActiveConsultation] = useState<Consultation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boundPatientId = localStorage.getItem("arogya_patient_id");
    if (!boundPatientId) {
      router.replace("/");
      return;
    }
    loadData(boundPatientId);
  }, [router]);

  const loadData = async (patientId: string) => {
    try {
      const ptData = await patientService.getPatientById(patientId);
      if (ptData) {
        setPatient(ptData);
        // Using a modified query fetching all consultations to find the verified one without needing doctorId 
        // Note: For MVP security we allowed doctorId read. But a patient phone reading its own data should be allowed in Phase 3. 
        // For now we'll fetch via a direct patient ID check if rules permit, but since rules check auth... 
        // Wait, if patient phone isn't authenticated as doctor anymore, they can't read!
        // But the doctor left it logged in! The device is still authenticated.
        const ctData = await patientService.getConsultationsForPatient(patientId, ptData.createdByDoctorId);
        const verified = ctData.find(c => c.status === "DOCTOR_VERIFIED" || c.status === "ACTIVE");
        if (verified) setActiveConsultation(verified);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDevice = () => {
    // Hidden debug/reset function to get back to doctor mode
    localStorage.removeItem("arogya_patient_id");
    router.replace("/");
  };

  if (loading) return <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-12 h-12"/></div>;

  return (
    <div className="min-h-screen bg-[#F0F7FF] pb-24 relative overflow-hidden">
      {/* Hidden reset button for development */}
      <button onClick={handleResetDevice} className="absolute top-4 right-4 p-4 text-blue-200 hover:text-blue-400 opacity-50 z-50">
        <LogOut size={24} />
      </button>

      <div className="max-w-md mx-auto px-6 pt-16">
        <h1 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight mb-2">
          Aarogya Voice
        </h1>
        
        <div className="mt-8 mb-10">
          <p className="text-3xl font-medium text-[#1E40AF]">
            Good morning,
          </p>
          <p className="text-5xl font-extrabold text-[#1E3A8A] mt-1">
            {patient?.name.split(" ")[0]}
          </p>
        </div>

        <div className="bg-white rounded-[2rem] shadow-xl shadow-blue-900/5 p-8 mb-8 border border-blue-100">
          <div className="flex items-center mb-6">
            <Sun className="text-amber-500 w-8 h-8 mr-3" />
            <h2 className="text-2xl font-bold text-[#1E3A8A]">Today's Medicines</h2>
          </div>

          {!activeConsultation ? (
            <p className="text-lg text-gray-500 py-4">No active medicines today.</p>
          ) : (
            <ul className="space-y-6">
              {activeConsultation.medicines.map((med, idx) => (
                <li key={idx} className="border-b border-gray-100 pb-6 last:border-0 last:pb-0">
                  <p className="text-3xl font-bold text-[#1E3A8A] mb-2">{med.medicineName}</p>
                  <div className="flex flex-wrap gap-2 text-lg text-blue-800 font-medium bg-blue-50 p-3 rounded-2xl">
                    <span>{med.dose}</span>
                    <span>•</span>
                    <span>{med.timing}</span>
                    {med.foodCondition && (
                      <>
                        <span>•</span>
                        <span>{med.foodCondition}</span>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {activeConsultation && (
          <button 
            className="w-full bg-[#2563EB] hover:bg-[#1D4ED8] text-white p-6 rounded-[2rem] shadow-xl shadow-blue-600/20 active:scale-95 transition-transform flex flex-col items-center justify-center space-y-3"
          >
            <Volume2 size={48} />
            <span className="text-2xl font-bold tracking-wide">HEAR AGAIN</span>
          </button>
        )}
      </div>
    </div>
  );
}
