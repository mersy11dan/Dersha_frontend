import { z } from "zod";

// E.164 for Ethiopia: +251 followed by 9 digits.
const ethiopianPhoneRegex = /^\+251[1-9][0-9]{8}$/;

// Fayda IDs are entered with optional dashes for readability (1234-5678-9012).
const faydaIdRegex = /^[0-9]{4}-?[0-9]{4}-?[0-9]{4}$/;

// =====================================================================================
// 1. REQUEST SCHEMAS (Input Validation Core)
// =====================================================================================

/**
 * Validates incoming registration data from Onboarding Step 1.
 */
export const UserRegistrationRequestSchema = z.object({
  full_name_raw: z
    .string({ error: "Full name is required" })
    .trim()
    .min(3, "Name must be at least 3 characters long")
    .max(150, "Name cannot exceed 150 characters"),
  email_address: z
    .string({ error: "Email address is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address format")
    .max(255, "Email address cannot exceed 255 characters"),
  phone_number_eth: z
    .string({ error: "Ethiopian phone number is required" })
    .trim()
    .regex(
      ethiopianPhoneRegex,
      "Phone number must match E.164 format: +251XXXXXXXXX",
    ),
  password_plain: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters long")
    .max(64, "Password cannot exceed 64 characters"),
  is_diaspora_account: z.boolean().default(false),
});

export const UserLoginRequestSchema = z.object({
  email_address: z
    .string({ error: "Email address is required" })
    .trim()
    .toLowerCase()
    .email("Invalid email address format"),
  password_plain: z
    .string({ error: "Password is required" })
    .min(1, "Password is required"),
});

/**
 * Validates incoming eKYC payloads from Onboarding Step 2.
 *
 * The client submits the live capture itself; the platform derives and stores
 * the SHA-256 biometric token server-side so a client can never forge one.
 */
export const FaydaKYCRequestSchema = z.object({
  fayda_id_number: z
    .string({ error: "Fayda National ID number is required" })
    .trim()
    .regex(faydaIdRegex, "Fayda ID must be 12 digits (e.g. 1234-5678-9012)"),
  live_selfie_base64: z
    .string({ error: "A live selfie capture is required" })
    .min(32, "The biometric capture payload is too small to be valid"),
  liveness_passed: z
    .boolean({ error: "Liveness result is required" })
    .refine((value) => value === true, {
      message:
        "Passive liveness check failed. Please retake your photo in better lighting.",
    }),
});

// =====================================================================================
// 2. RESPONSE SCHEMAS (Output Sanitization Core)
// =====================================================================================

/**
 * Filters out raw database attributes like password_hash, preventing
 * critical server credential leakage to the public internet client app.
 */
export const UserProfileResponseSchema = z.object({
  user_id: z.string().uuid(),
  full_name_raw: z.string(),
  email_address: z.string().email(),
  phone_number_eth: z.string(),
  fayda_id_number_masked: z.string().nullable(),
  date_of_birth: z.coerce.date().nullable(),
  account_status: z.enum([
    "PENDING_KYC",
    "ACTIVE_VERIFIED",
    "SUSPENDED_FRAUD",
    "FLAGGED_AML",
  ]),
  is_diaspora_account: z.boolean(),
  risk_score_matrix: z.number().int(),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

// =====================================================================================
// 3. TYPES INFERENCE (Compile-Time Integration)
// =====================================================================================
export type UserRegistrationRequest = z.infer<
  typeof UserRegistrationRequestSchema
>;
export type UserLoginRequest = z.infer<typeof UserLoginRequestSchema>;
export type FaydaKYCRequest = z.infer<typeof FaydaKYCRequestSchema>;
export type UserProfileResponse = z.infer<typeof UserProfileResponseSchema>;
