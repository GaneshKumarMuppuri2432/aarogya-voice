"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { patientService } from "@/features/patients/patientService";
import { useAuth } from "@/features/auth/AuthContext";
import { ArrowLeft, Mic, Square, Loader2, RefreshCw } from "lucide-react";

export default function NewConsultationPage() {
  const { id: patientId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const { isListening, transcript, setTranscript, startListening, stopListening, isSupported, error: sttError } = useSpeechToText();
  
  const [processingState, setProcessingState] = useState<"idle" | "processing" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleProcess = async () => {
    if (!transcript.trim()) {
      setErrorMessage("Please record an instruction first.");
      return;
    }

    setProcessingState("processing");
    setErrorMessage("");

    try {
      // Send transcript to backend extraction API
      const res = await fetch("/api/extract-treatment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to process instruction.");
      }

      // Save initial DRAFT to Firestore
      if (user) {
        const consultationId = await patientService.createConsultation(patientId as string, {
          doctorId: user.uid,
          transcript,
          status: "DRAFT", // strictly draft
          medicines: data.medicines,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          language: "English", // In real app, fetch from patient
        });
        
        setProcessingState("success");
        // Proceed to Doctor Review screen
        setTimeout(() => {
          router.push(`/patients/${patientId}/consultation/${consultationId}`);
        }, 1000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "We couldn't structure the instruction. The patient's treatment has NOT been activated. Please try recording again.");
      setProcessingState("error");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 mr-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">New Consultation</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 mt-8 flex flex-col items-center">
          
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Speak the instructions naturally</h2>
            <p className="text-gray-500">"Dolo 650 one tablet morning before breakfast and one tablet night after food for five days."</p>
          </div>

          {!isSupported && (
            <div className="w-full bg-amber-50 text-amber-800 p-4 rounded-xl text-sm mb-6">
              Your browser does not support voice recording. You can type the instruction manually.
            </div>
          )}

          {/* Large Recording Button */}
          <div className="mb-8 relative flex justify-center">
            {isListening && (
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75 scale-150"></div>
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              className={`relative z-10 p-8 rounded-full shadow-lg transition-transform active:scale-95 ${
                isListening ? "bg-red-500 hover:bg-red-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"
              }`}
            >
              {isListening ? <Square size={48} className="fill-current" /> : <Mic size={48} />}
            </button>
          </div>

          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">Instruction Transcript</label>
            <textarea
              className="w-full h-32 bg-gray-50 border-0 rounded-xl p-4 text-gray-900 focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Listening... or type manually here."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={isListening}
            />
          </div>

          {/* Status and Actions */}
          <div className="w-full">
            {(processingState === "error" || sttError) && (
              <div className="bg-red-50 text-red-800 p-4 rounded-xl text-sm mb-4">
                {sttError || errorMessage}
              </div>
            )}

            {processingState === "success" && (
              <div className="bg-green-50 text-green-800 p-4 rounded-xl text-sm mb-4 text-center font-medium">
                Treatment draft created. Redirecting to review...
              </div>
            )}

            <button
              onClick={handleProcess}
              disabled={isListening || !transcript.trim() || processingState === "processing" || processingState === "success"}
              className="w-full bg-blue-600 text-white p-4 rounded-xl text-lg font-semibold shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:bg-gray-400 flex justify-center items-center"
            >
              {processingState === "processing" ? (
                <>
                  <Loader2 className="animate-spin mr-2" /> Understanding instructions...
                </>
              ) : (
                "Review & Extract"
              )}
            </button>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
