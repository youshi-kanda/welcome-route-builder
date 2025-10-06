import { z } from "zod";
import { ja } from "@/i18n/ja";

// E.164 phone number format validation
export const phoneSchema = z
  .string()
  .min(1, ja.home.phoneRequired)
  .transform((val) => val.replace(/[\s-]/g, "")) // Remove spaces and hyphens
  .refine(
    (val) => /^\+\d{10,15}$/.test(val),
    ja.home.phoneInvalid
  );

export const applicationSchema = z.object({
  phone: phoneSchema,
  name: z.string().optional(),
  consent: z.boolean().refine((val) => val === true, {
    message: ja.home.consentRequired,
  }),
});

export const reservationSchema = z.object({
  date: z.date({
    required_error: ja.reserve.dateRequired,
  }),
  time: z.string().min(1, ja.reserve.timeRequired),
  reminder: z.boolean().default(true),
});

export type ApplicationFormData = z.infer<typeof applicationSchema>;
export type ReservationFormData = z.infer<typeof reservationSchema>;

// Format phone number for display
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, "");
  return cleaned;
}

// ALSOK 面接システム - Store user data in localStorage
const STORAGE_KEY = "alsok_user_data";
const APPLICANT_ID_KEY = "alsok_applicant_id";

export function saveUserData(data: { phone: string; name?: string; applicant_id?: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    if (data.applicant_id) {
      localStorage.setItem(APPLICANT_ID_KEY, data.applicant_id);
    }
  } catch (error) {
    console.error("Failed to save user data:", error);
  }
}

export function getUserData(): { phone: string; name?: string; applicant_id?: string } | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    const applicant_id = localStorage.getItem(APPLICANT_ID_KEY);
    const userData = data ? JSON.parse(data) : null;
    
    if (userData && applicant_id) {
      userData.applicant_id = applicant_id;
    }
    
    return userData;
  } catch (error) {
    console.error("Failed to get user data:", error);
    return null;
  }
}

export function getApplicantId(): string | null {
  try {
    return localStorage.getItem(APPLICANT_ID_KEY);
  } catch (error) {
    console.error("Failed to get applicant ID:", error);
    return null;
  }
}

export function clearUserData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(APPLICANT_ID_KEY);
  } catch (error) {
    console.error("Failed to clear user data:", error);
  }
}
