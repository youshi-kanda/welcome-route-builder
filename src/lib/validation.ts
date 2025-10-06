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

// Store user data in localStorage
const STORAGE_KEY = "alsok_user_data";

export function saveUserData(data: { phone: string; name?: string }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Failed to save user data:", error);
  }
}

export function getUserData(): { phone: string; name?: string } | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to get user data:", error);
    return null;
  }
}
