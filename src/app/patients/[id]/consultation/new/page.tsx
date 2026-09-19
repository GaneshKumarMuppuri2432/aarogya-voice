"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { patientService } from "@/features/patients/patientService";
import { useAuth } from "@/features/auth/AuthContext";
import { ArrowLeft, Mic, Square, Loader2, AlertCircle, RefreshCw, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NewConsultationPage() {
  const { id: patientId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const { isListening, transcript, setTranscript, startListening, stopListening, isSupported, error: sttError } = useSpeechToText();
  
  const [processingState, setProcessingState] = useState<"idle" | "processing" | "success" | "error" | "non_treatment">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleProcess = async () => {
    if (!transcript.trim()) {
      setErrorMessage("We couldn't hear an instruction. Please try recording again.");
      setProcessingState("error");
      return;
    }

    setProcessingState("processing");
    setErrorMessage("");

    try {
      const res = await fetch("/api/extract-treatment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "We couldn't process the doctor's instruction right now.");
      }

      // Handle Non-Treatment input explicitly
      if (data.success === false) {
        setErrorMessage(data.message || "No treatment information detected.");
        setProcessingState("non_treatment");
        return;
      }

      if (user) {
        const consultationId = await patientService.createConsultation(patientId as string, {
          doctorId: user.uid,
          transcript,
          status: "DRAFT",
          medicines: data.medicines,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          language: "English",
        });
        
        setProcessingState("success");
        setTimeout(() => {
          router.push(`/patients/${patientId}/consultation/${consultationId}`);
        }, 800);
      }
    } catch (err: any) {
      console.error("Consultation processing error:", err);
      setErrorMessage(err.message || "Please check your connection and try again.");
      setProcessingState("error");
    }
  };

  const handleReset = () => {
    setProcessingState("idle");
    setTranscript("");
    setErrorMessage("");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <button
              onClick={() => router.back()}
              className="p-2 -ml-2 mr-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">New Consultation</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 mt-8 flex flex-col items-center animate-in fade-in duration-300">
          
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Speak instructions naturally</h2>
            <p className="text-gray-500 text-sm">"Dolo 650 one tablet at 8:00 AM after food for five days."</p>
          </div>

          {(sttError || !isSupported) && (
            <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl text-sm mb-6 flex items-start">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 mt-0.5" />
              <span>{sttError || "Voice input isn't supported on this browser."}</span>
            </div>
          )}

          {/* Large Recording Button */}
          <div className="mb-8 relative flex justify-center">
            {isListening && (
              <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75 scale-150 motion-reduce:animate-none motion-reduce:scale-110"></div>
            )}
            <button
              onClick={isListening ? stopListening : startListening}
              disabled={processingState === "processing" || processingState === "success"}
              className={`relative z-10 p-8 rounded-full shadow-lg transition-all active:scale-95 ${
                isListening ? "bg-red-500 hover:bg-red-600 text-white scale-110" : "bg-blue-600 hover:bg-blue-700 text-white"
              } disabled:opacity-50`}
            >
              {isListening ? <Square size={48} className="fill-current" /> : <Mic size={48} />}
            </button>
          </div>
          
          <div className="h-6 mb-4 text-center">
            {isListening && <p className="text-red-500 font-bold animate-pulse flex items-center justify-center"><span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span> Recording...</p>}
            {!isListening && processingState === "idle" && <p className="text-gray-500 font-medium">Tap to record</p>}
            {processingState === "processing" && <p className="text-blue-600 font-medium flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin mr-2" /> Understanding...</p>}
          </div>

          <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-1 mb-6 transition-all focus-within:border-blue-300 focus-within:ring-2 focus-within:ring-blue-100">
            <div className="px-4 pt-3 pb-2 flex justify-between items-center border-b border-gray-100">
              <label className="text-sm font-semibold text-gray-700 block flex items-center">
                <Edit3 className="w-4 h-4 mr-1 text-gray-400" /> Transcript
              </label>
              {transcript.trim() && (
                <button onClick={() => setTranscript("")} className="text-xs text-red-500 font-medium hover:underline px-2 py-1 bg-red-50 rounded-lg">Clear</button>
              )}
            </div>
            <textarea
              className="w-full h-32 bg-transparent border-0 rounded-b-xl p-4 text-gray-900 focus:ring-0 resize-none"
              placeholder={isListening ? "Recording in progress..." : "Tap the mic or type manually here..."}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={isListening || processingState === "processing" || processingState === "success"}
            />
          </div>

          {/* Status and Actions */}
          <div className="w-full space-y-4">
            
            {/* Non-Treatment Rejection State */}
            {processingState === "non_treatment" && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-5 rounded-2xl animate-in slide-in-from-bottom-2 duration-300">
                <h3 className="font-bold flex items-center mb-2">
                  <AlertCircle className="w-5 h-5 mr-2 text-amber-600" /> 
                  NO TREATMENT DETECTED
                </h3>
                <p className="text-sm mb-4">{errorMessage}</p>
                <p className="text-xs text-amber-700 font-medium mb-4">
                  Examples:<br/>• Medicine name<br/>• Dose & Frequency<br/>• When to take it
                </p>
                <div className="flex space-x-3">
                  <Button variant="outline" fullWidth onClick={handleReset} className="bg-white">
                    TRY AGAIN
                  </Button>
                </div>
              </div>
            )}

            {/* Standard Error State */}
            {processingState === "error" && errorMessage && (
              <div className="bg-red-50 border border-red-100 text-red-800 p-4 rounded-xl text-sm animate-in slide-in-from-bottom-2">
                <p className="font-medium">{errorMessage}</p>
                <button onClick={handleReset} className="mt-3 flex items-center text-red-600 font-bold hover:underline">
                  <RefreshCw className="w-4 h-4 mr-1" /> Try Again
                </button>
              </div>
            )}

            {/* Success State */}
            {processingState === "success" && (
              <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-xl text-sm text-center font-bold flex flex-col items-center animate-in zoom-in-95">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2 text-green-600">✓</div>
                Treatment draft created. Redirecting...
              </div>
            )}

            {(processingState === "idle" || processingState === "processing") && (
              <Button
                size="large"
                fullWidth
                onClick={handleProcess}
                disabled={isListening || !transcript.trim() || processingState === "processing"}
                className="shadow-md py-5 text-lg transition-transform active:scale-95"
              >
                {processingState === "processing" ? (
                  <>
                    <Loader2 className="animate-spin mr-2 w-5 h-5" /> Processing...
                  </>
                ) : (
                  "Review & Extract"
                )}
              </Button>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
