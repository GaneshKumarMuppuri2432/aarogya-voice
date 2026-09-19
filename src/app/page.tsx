"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { User, Stethoscope } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Auto-redirect to patient mode if this device is already bound to a patient
    const boundPatientId = localStorage.getItem("arogya_patient_id");
    if (boundPatientId) {
      router.replace("/patient");
    }
  }, [router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col items-center justify-center p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-blue-900 tracking-tight mb-2">Aarogya Voice</h1>
        <p className="text-blue-700 font-medium">Doctor-verified care, heard and remembered.</p>
      </div>

      <div className="w-full max-w-sm space-y-6">
        <Button
          fullWidth
          size="large"
          className="h-32 text-xl flex flex-col space-y-3 bg-white text-blue-900 border-2 border-transparent hover:border-blue-200 shadow-lg hover:shadow-xl transition-all"
          onClick={() => router.push("/patient")}
        >
          <User size={40} className="text-blue-500" />
          <span>Patient Mode</span>
        </Button>

        <Button
          fullWidth
          variant="outline"
          size="large"
          className="h-24 flex flex-col space-y-2 border-blue-200 bg-transparent hover:bg-blue-100/50"
          onClick={() => router.push("/doctor-setup")}
        >
          <Stethoscope size={28} className="text-blue-600" />
          <span>Doctor Mode (Setup)</span>
        </Button>
      </div>
    </div>
  );
}
