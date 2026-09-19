"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ProtectedRoute from "@/components/ProtectedRoute";
import { patientService } from "@/features/patients/patientService";
import { useAuth } from "@/features/auth/AuthContext";
import { ArrowLeft, Loader2 } from "lucide-react";

const patientSchema = z.object({
  name: z.string().min(2, "Name is required"),
  age: z.string().min(1, "Valid age is required"),
  phone: z.string().min(10, "Valid phone number required"),
  preferredLanguage: z.string().min(1, "Please select a language"),
  caregiverName: z.string().optional(),
  caregiverPhone: z.string().optional(),
  relationship: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export default function NewPatientPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [submitError, setSubmitError] = useState("");
  
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      preferredLanguage: "Tamil",
    }
  });

  const onSubmit = async (data: PatientFormValues) => {
    if (!user) return;
    setSubmitError("");
    
    try {
      const patientId = await patientService.createPatient({
        ...data,
        age: parseInt(data.age, 10),
        createdByDoctorId: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      router.push(`/patients/${patientId}`);
    } catch (err: any) {
      console.error(err);
      setSubmitError("Failed to save patient. Please try again.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 pb-20">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-md mx-auto px-4 py-4 flex items-center">
            <button
              type="button"
              onClick={() => router.back()}
              className="p-2 -ml-2 mr-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900">Add Patient</h1>
          </div>
        </header>

        <main className="max-w-md mx-auto px-4 mt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {submitError && (
              <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">
                {submitError}
              </div>
            )}

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">Patient Details</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  {...register("name")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  placeholder="e.g. Lakshmi"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    {...register("age")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                  {errors.age && <p className="text-red-500 text-sm mt-1">{errors.age.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    type="tel"
                    {...register("phone")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language *</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Tamil", "Hindi", "Telugu", "Kannada", "Malayalam", "English"].map((lang) => (
                    <label key={lang} className="flex items-center p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-blue-50 has-[:checked]:bg-blue-50 has-[:checked]:border-blue-500">
                      <input
                        type="radio"
                        value={lang}
                        {...register("preferredLanguage")}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-3 text-gray-900">{lang}</span>
                    </label>
                  ))}
                </div>
                {errors.preferredLanguage && <p className="text-red-500 text-sm mt-1">{errors.preferredLanguage.message}</p>}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-5">
              <h2 className="font-semibold text-gray-800 text-lg border-b pb-2">Caregiver Details (Optional)</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Caregiver Name</label>
                <input
                  {...register("caregiverName")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    {...register("caregiverPhone")}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input
                    {...register("relationship")}
                    placeholder="e.g. Son"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-4 px-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="animate-spin w-6 h-6" /> : "Save Patient"}
            </button>
          </form>
        </main>
      </div>
    </ProtectedRoute>
  );
}
