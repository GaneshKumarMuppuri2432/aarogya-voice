"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { patientService } from "@/features/patients/patientService";
import { reminderService } from "@/features/reminders/reminderService";
import { Patient, Reminder } from "@/types";
import { useVoiceOutput } from "@/hooks/useVoiceOutput";
import { Volume2, Loader2, LogOut, Sun, CheckCircle2, Clock, VolumeX, BellRing } from "lucide-react";

export default function PatientHomePage() {
  const router = useRouter();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Active Alarm State
  const [activeAlarmTime, setActiveAlarmTime] = useState<string | null>(null);
  
  const { speak, stop, isSpeaking, isSupported: isTTSSupported } = useVoiceOutput();

  useEffect(() => {
    const boundPatientId = localStorage.getItem("arogya_patient_id");
    if (!boundPatientId) {
      router.replace("/");
      return;
    }
    loadData(boundPatientId);
    requestNotificationPermission();
  }, [router]);

  // The active time-checker loop
  useEffect(() => {
    if (reminders.length === 0) return;

    const interval = setInterval(() => {
      const now = new Date();
      // Generates e.g. "08:00 AM" (matching Gemini's standard output)
      const currentTimeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      
      const dueGroup = groupedReminders[currentTimeString];
      
      // If there's a scheduled group for exactly right now, and not all are completed
      if (dueGroup && dueGroup.some(r => r.status !== "COMPLETED")) {
        if (activeAlarmTime !== currentTimeString) {
          triggerAlarm(currentTimeString, dueGroup);
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [reminders, activeAlarmTime]);

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission !== "granted") {
      await Notification.requestPermission();
    }
  };

  const triggerAlarm = (timeString: string, items: Reminder[]) => {
    setActiveAlarmTime(timeString);
    
    // Attempt Browser Notification (System Push) if in background
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Aarogya Voice - Medicine Due!", {
        body: `It is ${timeString}. Please take your medicines.`,
        icon: "/icons/icon-192x192.png",
      });
    }

    // Attempt to auto-speak (Note: browsers may block auto-play unless user interacted with page recently)
    handleHearAgain(timeString, items);
  };

  const loadData = async (patientId: string) => {
    try {
      const ptData = await patientService.getPatientById(patientId);
      if (ptData) setPatient(ptData);
      
      const rmData = await reminderService.getRemindersForPatient(patientId);
      setReminders(rmData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResetDevice = () => {
    localStorage.removeItem("arogya_patient_id");
    router.replace("/");
  };

  const markTaken = async (reminderId: string) => {
    if (!patient) return;
    
    setReminders(prev => prev.map(r => r.reminderId === reminderId ? { ...r, status: "COMPLETED" } : r));
    try {
      await reminderService.markReminderTaken(patient.patientId!, reminderId);
      // Close alarm modal if all taken for this time
      if (activeAlarmTime) {
        const remainingForAlarm = reminders.filter(r => r.scheduledTime === activeAlarmTime && r.reminderId !== reminderId && r.status !== "COMPLETED");
        if (remainingForAlarm.length === 0) {
          setActiveAlarmTime(null);
        }
      }
    } catch (e) {
      console.error(e);
      await loadData(patient.patientId!);
    }
  };

  const markAllTaken = (timeString: string, items: Reminder[]) => {
    items.forEach(item => {
      if (item.status !== "COMPLETED") markTaken(item.reminderId!);
    });
    setActiveAlarmTime(null);
    stop();
  };

  // Group reminders by time
  const groupedReminders = reminders.reduce((acc, r) => {
    if (!acc[r.scheduledTime]) acc[r.scheduledTime] = [];
    acc[r.scheduledTime].push(r);
    return acc;
  }, {} as Record<string, Reminder[]>);

  const handleHearAgain = (timeGroup: string, grouped: Reminder[]) => {
    if (!patient || !isTTSSupported) return;
    
    let text = `Your medicines are due for ${timeGroup}. `;
    if (grouped.length === 1) {
      const r = grouped[0];
      text += `Please take ${r.dosage} of ${r.medicineName} ${r.foodCondition ? r.foodCondition : ''}.`;
    } else {
      grouped.forEach(r => {
        text += `Take ${r.dosage} of ${r.medicineName} ${r.foodCondition ? r.foodCondition : ''}. `;
      });
    }

    const langMap: Record<string, string> = {
      "Tamil": "ta-IN",
      "English": "en-IN"
    };

    const targetLang = langMap[patient.preferredLanguage] || "en-IN";
    speak(text, targetLang);
  };

  // Debug tool to force alarm popup immediately without waiting for exact time
  const testAlarm = () => {
    const firstUncompletedTime = Object.keys(groupedReminders).find(time => 
      groupedReminders[time].some(r => r.status !== "COMPLETED")
    );
    if (firstUncompletedTime) {
      triggerAlarm(firstUncompletedTime, groupedReminders[firstUncompletedTime]);
    } else {
      alert("No pending medicines to trigger alarm for!");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#F0F7FF] flex items-center justify-center"><Loader2 className="animate-spin text-blue-500 w-12 h-12"/></div>;

  return (
    <div className="min-h-screen bg-[#F0F7FF] pb-24 relative overflow-hidden">
      <button onClick={handleResetDevice} className="absolute top-4 right-4 p-4 text-blue-200 hover:text-blue-400 opacity-50 z-50">
        <LogOut size={24} />
      </button>

      <div className="max-w-md mx-auto px-6 pt-16">
        <h1 className="text-4xl font-extrabold text-[#1E3A8A] tracking-tight mb-2">
          Aarogya Voice
        </h1>
        
        <div className="mt-8 mb-10">
          <p className="text-3xl font-medium text-[#1E40AF]">Good morning,</p>
          <p className="text-5xl font-extrabold text-[#1E3A8A] mt-1">
            {patient?.name.split(" ")[0]}
          </p>
        </div>

        {Object.keys(groupedReminders).length === 0 ? (
          <p className="text-xl text-gray-500 py-4 bg-white rounded-3xl p-8 text-center shadow-sm">No medicines scheduled for today.</p>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedReminders).map(([time, items]) => {
              const allCompleted = items.every(i => i.status === "COMPLETED");

              return (
                <div key={time} className={`bg-white rounded-[2rem] shadow-xl p-8 border-2 ${allCompleted ? 'border-green-100 opacity-80' : 'border-blue-100 shadow-blue-900/5'}`}>
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-6">
                    <h3 className="text-3xl font-extrabold text-[#1E3A8A] flex items-center">
                      <Clock className="w-6 h-6 mr-2 text-blue-400" />
                      {time}
                    </h3>
                    {allCompleted && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center">
                        <CheckCircle2 className="w-4 h-4 mr-1" /> TAKEN
                      </span>
                    )}
                  </div>

                  <ul className="space-y-6 mb-8">
                    {items.map((r) => (
                      <li key={r.reminderId} className="flex flex-col">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
                              <span className={`w-3 h-3 rounded-full mr-3 ${r.status === 'COMPLETED' ? 'bg-green-400' : 'bg-blue-500'}`}></span>
                              {r.medicineName}
                            </p>
                            <div className="flex flex-wrap gap-2 text-lg text-blue-800 font-medium ml-6">
                              <span className="bg-blue-50 px-3 py-1 rounded-xl">{r.dosage}</span>
                              {r.foodCondition && <span className="bg-blue-50 px-3 py-1 rounded-xl">{r.foodCondition}</span>}
                            </div>
                          </div>
                        </div>

                        {r.status !== "COMPLETED" && (
                          <button
                            onClick={() => markTaken(r.reminderId!)}
                            className="mt-4 ml-6 self-start border-2 border-gray-200 text-gray-600 hover:border-green-500 hover:bg-green-50 hover:text-green-700 font-bold px-6 py-3 rounded-full transition-colors flex items-center text-lg"
                          >
                            <CheckCircle2 className="w-5 h-5 mr-2" /> Mark as Taken
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  <button 
                    onClick={() => handleHearAgain(time, items)}
                    disabled={!isTTSSupported}
                    className={`w-full text-white p-6 rounded-[2rem] transition-transform flex flex-col items-center justify-center space-y-3 ${
                      isTTSSupported ? 'bg-[#2563EB] hover:bg-[#1D4ED8] shadow-xl shadow-blue-600/20 active:scale-95' : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isSpeaking ? (
                      <>
                        <Volume2 size={48} className="animate-pulse" />
                        <span className="text-2xl font-bold tracking-wide animate-pulse">SPEAKING...</span>
                      </>
                    ) : (
                      <>
                        {isTTSSupported ? <Volume2 size={48} /> : <VolumeX size={48} />}
                        <span className="text-2xl font-bold tracking-wide">
                          {isTTSSupported ? 'HEAR AGAIN' : 'VOICE NOT SUPPORTED'}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-12 mb-8 text-center bg-blue-50/50 p-6 rounded-3xl border border-blue-100">
          <p className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-2">Coming Soon</p>
          <p className="text-blue-800 font-medium text-lg">Automated Voice-Call Reminders</p>
          <p className="text-blue-500 text-sm mt-1">Get phone calls when it's time for medicine.</p>
        </div>
      </div>

      {/* ACTIVE ALARM OVERLAY (Requirement 4: ALARM UI) */}
      {activeAlarmTime && groupedReminders[activeAlarmTime] && (
        <div className="fixed inset-0 bg-blue-900/90 z-[100] flex flex-col items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl flex flex-col items-center text-center">
            
            <div className="bg-red-100 text-red-600 p-4 rounded-full mb-6 animate-bounce">
              <BellRing size={48} />
            </div>
            
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">MEDICINE DUE</h2>
            <p className="text-4xl font-bold text-blue-600 mb-8">{activeAlarmTime}</p>

            <div className="w-full space-y-4 mb-8 text-left">
              {groupedReminders[activeAlarmTime].filter(r => r.status !== "COMPLETED").map(r => (
                <div key={r.reminderId} className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-4">
                  <p className="text-2xl font-bold text-gray-900">{r.medicineName}</p>
                  <p className="text-lg text-gray-600 font-medium">{r.dosage} • {r.foodCondition}</p>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handleHearAgain(activeAlarmTime, groupedReminders[activeAlarmTime])}
              className="w-full bg-[#2563EB] text-white p-6 rounded-3xl font-bold text-2xl flex items-center justify-center space-x-3 mb-4 shadow-lg active:scale-95"
            >
              <Volume2 size={32} />
              <span>Listen</span>
            </button>

            <button 
              onClick={() => markAllTaken(activeAlarmTime, groupedReminders[activeAlarmTime])}
              className="w-full bg-green-500 text-white p-6 rounded-3xl font-bold text-2xl flex items-center justify-center space-x-3 shadow-lg active:scale-95"
            >
              <CheckCircle2 size={32} />
              <span>MARK ALL AS TAKEN</span>
            </button>
            
            <button 
              onClick={() => { setActiveAlarmTime(null); stop(); }}
              className="mt-6 text-gray-500 font-bold p-4 text-lg underline"
            >
              Close for now
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
