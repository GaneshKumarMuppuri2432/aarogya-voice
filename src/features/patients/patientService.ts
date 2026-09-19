import { collection, addDoc, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Patient, Consultation } from "@/types";

export const patientService = {
  async createPatient(patientData: Omit<Patient, "patientId">): Promise<string> {
    const docRef = await addDoc(collection(db, "patients"), {
      ...patientData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return docRef.id;
  },

  async getPatientsByDoctor(doctorId: string): Promise<Patient[]> {
    const q = query(
      collection(db, "patients"),
      where("createdByDoctorId", "==", doctorId)
    );
    const querySnapshot = await getDocs(q);
    const patients: Patient[] = [];
    querySnapshot.forEach((doc) => {
      patients.push({ patientId: doc.id, ...doc.data() } as Patient);
    });
    return patients;
  },

  async getPatientById(patientId: string): Promise<Patient | null> {
    const docRef = doc(db, "patients", patientId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { patientId: docSnap.id, ...docSnap.data() } as Patient;
    }
    return null;
  },

  // --- Phase 2: Consultations ---
  
  async createConsultation(patientId: string, consultationData: Omit<Consultation, "consultationId" | "patientId">): Promise<string> {
    const consultationsRef = collection(db, "patients", patientId, "consultations");
    const docRef = await addDoc(consultationsRef, {
      ...consultationData,
      patientId,
    });
    return docRef.id;
  },

  async getConsultationById(patientId: string, consultationId: string): Promise<Consultation | null> {
    const docRef = doc(db, "patients", patientId, "consultations", consultationId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { consultationId: docSnap.id, ...docSnap.data() } as Consultation;
    }
    return null;
  },

  async updateConsultation(patientId: string, consultationId: string, updates: Partial<Consultation>): Promise<void> {
    const docRef = doc(db, "patients", patientId, "consultations", consultationId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async getConsultationsForPatient(patientId: string, doctorId: string): Promise<Consultation[]> {
    // SECURITY FIX: Must include where("doctorId", "==", doctorId) to satisfy Firestore Rules
    const q = query(
      collection(db, "patients", patientId, "consultations"),
      where("doctorId", "==", doctorId)
    );
    const querySnapshot = await getDocs(q);
    const consultations: Consultation[] = [];
    querySnapshot.forEach((doc) => {
      consultations.push({ consultationId: doc.id, ...doc.data() } as Consultation);
    });
    return consultations.sort((a, b) => b.createdAt - a.createdAt);
  }
};
