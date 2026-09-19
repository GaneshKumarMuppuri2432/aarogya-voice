"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export default function Home() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
          className="h-32 text-2xl font-bold flex flex-col space-y-3 bg-white text-blue-900 border-2 border-transparent hover:border-blue-200 shadow-lg hover:shadow-xl transition-all"
          onClick={() => router.push("/patient")}
        >
          <span className="text-5xl">🧑🏽‍🦳</span>
          <span>Patient Mode</span>
        </Button>

        <Button
          fullWidth
          variant="outline"
          size="large"
          className="h-28 text-xl font-bold flex flex-col space-y-2 border-blue-200 bg-transparent hover:bg-blue-100/50"
          onClick={() => router.push("/doctor-setup")}
        >
          <span className="text-4xl">🩺</span>
          <span>Doctor Mode</span>
        </Button>
      </div>
    </div>
  );
}
