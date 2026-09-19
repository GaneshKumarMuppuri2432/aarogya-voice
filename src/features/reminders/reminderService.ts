import { collection, addDoc, getDocs, query, doc, updateDoc, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Consultation, Reminder } from "@/types";

export const reminderService = {
  // Generate daily reminders from a verified consultation
  // For MVP, we simply map each Medicine to a single 'Today' reminder schedule
  // based on its specified timing.
  async generateRemindersForConsultation(patientId: string, consultation: Consultation, preferredLanguage: string): Promise<void> {
    if (consultation.status !== "DOCTOR_VERIFIED") {
      throw new Error("Cannot generate reminders for unverified treatments.");
    }

    const batch = writeBatch(db);
    const remindersRef = collection(db, "patients", patientId, "reminders");

    for (const med of consultation.medicines) {
      if (!med.timing || !med.medicineName || !med.dose) continue;

      const newReminder: Omit<Reminder, "reminderId"> = {
        patientId,
        consultationId: consultation.consultationId!,
        medicineId: med.id,
        medicineName: med.medicineName,
        dosage: med.dose,
        scheduledTime: med.timing, 
        foodCondition: med.foodCondition,
        status: "UPCOMING",
        preferredLanguage,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      const docRef = doc(remindersRef); // Auto-generate ID
      batch.set(docRef, newReminder);
    }

    await batch.commit();
  },

  async getRemindersForPatient(patientId: string): Promise<Reminder[]> {
    const q = query(collection(db, "patients", patientId, "reminders"));
    const querySnapshot = await getDocs(q);
    const reminders: Reminder[] = [];
    querySnapshot.forEach((doc) => {
      reminders.push({ reminderId: doc.id, ...doc.data() } as Reminder);
    });
    // For MVP, order by scheduled time simply (lexicographical sort)
    return reminders.sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  },

  async markReminderTaken(patientId: string, reminderId: string): Promise<void> {
    const docRef = doc(db, "patients", patientId, "reminders", reminderId);
    await updateDoc(docRef, {
      status: "COMPLETED",
      updatedAt: Date.now()
    });
  }
};
