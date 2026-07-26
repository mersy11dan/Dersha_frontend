import { z } from "zod";

// Base structural validation rules
const uuidRegex =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const sha256Regex = /^[a-fA-F0-9]{64}$/;

// =====================================================================================
// 1. INPUT REQUEST SCHEMAS (Asset Sourcing & Onboarding Layer)
// =====================================================================================

/**
 * Validates the core structural data required to register a physical real-world asset.
 * Handles the Contribution-in-Kind data layer required for legal isolation.
 */
export const CreateAssetMasterRequestSchema = z.object({
  asset_name: z
    .string({ error: "Asset structural name is required" })
    .min(5, "Asset name must be descriptive (at least 5 characters)")
    .max(150, "Asset name cannot exceed 150 characters"),
  category: z.enum(
    ["REAL_ESTATE", "COMMODITY_GOLD", "LOGISTICS_VEHICLE", "MICRO_BUSINESS"],
    {
      error: "Please specify a valid asset classification type",
    },
  ),
  physical_location_description: z
    .string({ error: "Granular physical location data is required" })
    .min(
      10,
      "Location description must include sub-city, woreda, or storage vault details",
    ),
  independent_appraised_value_etb: z
    .number({ error: "Certified appraisal value is required" })
    .positive("Asset valuation must represent a positive financial metric")
    .min(
      50000,
      "Minimum individual platform asset onboarding value is 50,000 ETB",
    )
    .multipleOf(
      0.0001,
      "Financial value precision cannot exceed 4 decimal places",
    ),
  last_appraisal_date: z
    .string({ error: "Appraisal execution date stamp is required" })
    .pipe(z.coerce.date())
    .refine((date) => date <= new Date(), {
      message: "Appraisal timestamp parameter cannot exist in the future",
    }),
  custodian_bank_name: z
    .string({
      error: "Custodian bank partner identifier is required",
    })
    .min(3, "Bank naming layout is too short"),
  custodian_trust_deed_reference: z
    .string({
      error: "Physical trust deed registry index is required",
    })
    .min(
      5,
      "Trust deed serial marker must match physical bank vault certificates",
    ),
  original_owner_user_id: z
    .string()
    .regex(
      uuidRegex,
      "Original owner reference must be a valid system User UUID",
    )
    .nullable()
    .optional(),
  //   body: z.object({
  //   }),
});

/**
 * Validates incoming appraisal adjustment payloads sent by ECMA-certified surveyors.
 * Enforces cryptographic document auditing trails to block manual appraisal forgery.
 */
export const UpdateAssetAppraisalRequestSchema = z.object({
  asset_id: z
    .string({ error: "Target Asset UUID parameter is required" })
    .regex(uuidRegex, "Malformed Asset UUID signature"),
  surveyor_firm_license: z
    .string({
      error: "Surveyor operational license validation is required",
    })
    .min(5, "License indicator format is invalid"),
  new_appraised_value_etb: z
    .number({ error: "Updated financial evaluation is required" })
    .positive("Value must be a positive float metric")
    .multipleOf(0.0001, "Value precision boundary overflow"),
  physical_inspection_date: z
    .string({ error: "Field verification date is required" })
    .pipe(z.coerce.date()),
  valuation_report_document_hash: z
    .string({
      error: "Signed document report audit signature is required",
    })
    .regex(
      sha256Regex,
      "Document checksum parameters must evaluate to a valid SHA-256 string",
    ),
  //   body: z.object({
  //   }),
});

// =====================================================================================
// 2. OUTPUT RESPONSE SCHEMAS (Asset Reporting Sanitization Layer)
// =====================================================================================

/**
 * Sanitizes physical asset data rows before exporting them to public marketplace routers.
 */
export const AssetMasterResponseSchema = z.object({
  asset_id: z.string().uuid(),
  asset_name: z.string(),
  category: z.enum([
    "REAL_ESTATE",
    "COMMODITY_GOLD",
    "LOGISTICS_VEHICLE",
    "MICRO_BUSINESS",
  ]),
  physical_location_description: z.string(),
  independent_appraised_value_etb: z.number(),
  last_appraisal_date: z.date(),
  custodian_bank_name: z.string(),
  custodian_trust_deed_reference: z.string(),
  original_owner_user_id: z.string().uuid().nullable(),
  created_at: z.date(),
  updated_at: z.date(),
});

// =====================================================================================
// 3. TYPES INFERENCE (Compile-Time TypeScript Contract Verification)
// =====================================================================================
export type CreateAssetMasterRequest = z.infer<
  typeof CreateAssetMasterRequestSchema
>;
export type UpdateAssetAppraisalRequest = z.infer<
  typeof UpdateAssetAppraisalRequestSchema
>;
export type AssetMasterResponse = z.infer<typeof AssetMasterResponseSchema>;
