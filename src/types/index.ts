export interface Caregiver {
  caregiverName: string;
  caregiverPhone: string;
  relationship: string;
}

export interface Patient {
  patientId?: string; // set by firestore document id
  name: string;
  age: number;
  phone: string;
  preferredLanguage: string;
  createdByDoctorId: string;
  createdAt: number;
  updatedAt: number;
  caregiverName?: string;
  caregiverPhone?: string;
  relationship?: string;
}

export interface Doctor {
  uid: string;
  email: string | null;
  displayName: string | null;
}

// Phase 2 Types

export type TreatmentStatus = "DRAFT" | "NEEDS_REVIEW" | "DOCTOR_VERIFIED" | "ACTIVE";

export interface MedicineInstruction {
  id: string;
  medicineName: string | null;
  dose: string | null;
  frequency: string | null;
  timing: string | null;
  foodCondition: string | null;
  duration: string | null;
  additionalInstructions: string | null;
}

export interface Consultation {
  consultationId?: string;
  patientId: string;
  doctorId: string;
  transcript: string;
  status: TreatmentStatus;
  medicines: MedicineInstruction[];
  createdAt: number;
  updatedAt: number;
  verifiedAt?: number | null;
  verifiedBy?: string | null;
  language: string;
}
