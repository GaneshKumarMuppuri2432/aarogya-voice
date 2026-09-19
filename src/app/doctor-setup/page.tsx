"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/features/auth/AuthContext";
import { patientService } from "@/features/patients/patientService";
import { Patient } from "@/types";
import { useRouter } from "next/navigation";
import { Plus, Search, LogOut, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function DoctorSetupPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadPatients();
    }
  }, [user]);

  const loadPatients = async () => {
    try {
      if (user) {
        const data = await patientService.getPatientsByDoctor(user.uid);
        setPatients(data.sort((a, b) => b.createdAt - a.createdAt));
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.phone.includes(searchQuery)
  );

  const handleSelectPatient = (patientId: string) => {
    // Bind device to this patient and redirect to doctor context for consultation
    localStorage.setItem("arogya_patient_id", patientId);
    router.push(`/patients/${patientId}`);
  };

  const handleCreatePatient = () => {
    router.push("/patients/new");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-10 border-b border-gray-100">
          <div className="max-w-md mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center">
              <Smartphone className="w-5 h-5 mr-2 text-blue-600" />
              Device Setup
            </h1>
            <button
              onClick={() => logout()}
              className="p-2 text-gray-400 hover:text-gray-700 bg-gray-50 rounded-full transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 mt-8 space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Who owns this phone?</h2>
            <p className="text-gray-600 text-sm">
              Select or create a patient profile to set up this device for them.
            </p>
          </div>

          <Button
            fullWidth
            size="large"
            onClick={handleCreatePatient}
            className="flex items-center space-x-2 shadow-md"
          >
            <Plus size={24} />
            <span>Create New Patient</span>
          </Button>

          <div className="relative mt-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search existing patients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border-none shadow-sm rounded-2xl bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 text-base"
            />
          </div>

          <div className="pt-2">
            {loading ? (
              <div className="text-center py-6 text-gray-500">Loading...</div>
            ) : filteredPatients.length === 0 ? (
              <div className="text-center py-6 text-gray-500">No patients found.</div>
            ) : (
              <ul className="space-y-3">
                {filteredPatients.map((patient) => (
                  <li key={patient.patientId}>
                    <Card 
                      onClick={() => handleSelectPatient(patient.patientId!)}
                      className="flex items-center justify-between p-4 border-2 border-transparent hover:border-blue-200"
                    >
                      <div>
                        <p className="text-lg font-bold text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-500 mt-1">{patient.age} yrs • {patient.phone}</p>
                      </div>
                      <div className="text-blue-600 font-medium text-sm">
                        Select →
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
