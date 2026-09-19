"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/features/auth/AuthContext";
import { patientService } from "@/features/patients/patientService";
import { Patient, Consultation } from "@/types";
import { ArrowLeft, User, Phone, Pill, CheckCircle2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function DoctorContextPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id && user) {
      loadData(id as string, user.uid);
    }
  }, [id, user]);

  const loadData = async (patientId: string, doctorId: string) => {
    try {
      const ptData = await patientService.getPatientById(patientId);
      const ctData = await patientService.getConsultationsForPatient(patientId, doctorId);
      if (ptData) setPatient(ptData);
      if (ctData) setConsultations(ctData);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishSetup = () => {
    // End doctor context, go to Patient mode
    router.push("/patient");
  };

  if (loading || !patient) return null;

  const currentTreatment = consultations.find(c => c.status === "DOCTOR_VERIFIED" || c.status === "ACTIVE");

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-24">
        <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center">
              <button onClick={() => router.push('/doctor-setup')} className="p-2 -ml-2 mr-2 text-gray-600 hover:text-gray-900 rounded-full">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-xl font-bold text-gray-900 flex items-center">
                <UserCheck className="w-5 h-5 mr-2 text-blue-600" />
                Doctor Context
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 mt-6 space-y-6">
          <Card className="border-blue-100 bg-blue-50/30">
            <h2 className="text-2xl font-bold text-gray-900">{patient.name}</h2>
            <div className="flex items-center text-gray-600 mt-2 text-sm font-medium">
              <Phone className="w-4 h-4 mr-2" /> {patient.phone} • {patient.age} yrs
            </div>
          </Card>

          <Button 
            fullWidth 
            size="large"
            onClick={() => router.push(`/patients/${patient.patientId}/consultation/new`)}
            className="shadow-md py-6 text-lg"
          >
            <MicIcon />
            <span className="ml-2">Record Treatment</span>
          </Button>

          <Card>
            <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center">
              <Pill className="w-5 h-5 mr-2 text-blue-600" />
              Verified Treatment
            </h3>
            {currentTreatment ? (
              <div className="space-y-4">
                <Badge variant="success" className="mb-2"><CheckCircle2 className="w-3 h-3 mr-1 inline" /> Verified</Badge>
                {currentTreatment.medicines.map((m, i) => (
                  <div key={i} className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                    <p className="font-bold text-gray-900">{m.medicineName}</p>
                    <p className="text-sm text-gray-600 mt-1">{m.dose} • {m.timing}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-6 text-center border border-dashed border-gray-300">
                <p className="text-gray-500 font-medium text-sm">No verified treatment yet.</p>
              </div>
            )}
          </Card>

          <div className="pt-8">
            <Button 
              fullWidth 
              variant="outline"
              size="large"
              onClick={handleFinishSetup}
            >
              Finish Setup & Hand to Patient
            </Button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function MicIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
  );
}
