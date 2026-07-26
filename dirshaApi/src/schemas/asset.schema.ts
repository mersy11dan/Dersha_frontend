import { z } from "zod";

export const ASSET_CATEGORIES = [
  "REAL_ESTATE",
  "COMMODITY_GOLD",
  "LOGISTICS_VEHICLE",
  "MICRO_BUSINESS",
  "AGRICULTURE",
  "FINE_ART",
  "INFRASTRUCTURE",
] as const;

/**
 * Flow 2 Step 1: an asset enters the platform together with the independent
 * valuation that justifies its price. Neither is meaningful without the other,
 * so they are submitted and stored atomically.
 */
export const AssetAppraisalSubmissionSchema = z.object({
  asset_name: z
    .string({ error: "Asset name is required" })
    .trim()
    .min(3, "Asset name must be at least 3 characters")
    .max(150, "Asset name cannot exceed 150 characters"),
  category: z.enum(ASSET_CATEGORIES, {
    error: "Select a supported asset category",
  }),
  physical_location_description: z
    .string({ error: "Physical location is required" })
    .trim()
    .min(10, "Describe the physical location in more detail"),
  original_owner_user_id: z
    .string({ error: "The original owner must be an existing verified user" })
    .uuid("Invalid owner user id"),

  surveyor_name: z
    .string({ error: "Surveyor name is required" })
    .trim()
    .min(3)
    .max(150),
  surveyor_ecma_license_ref: z
    .string({ error: "The surveyor's ECMA licence reference is required" })
    .trim()
    .min(4)
    .max(100),
  appraised_value_etb: z
    .number({ error: "Appraised value is required" })
    .positive("Appraised value must be greater than zero")
    .max(10_000_000_000, "Appraised value exceeds the platform ceiling"),
  appraisal_date: z
    .string({ error: "Appraisal date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Appraisal date must be YYYY-MM-DD"),
  structural_status_notes: z.string().trim().max(2000).optional(),
  // SHA-256 of the signed valuation PDF, so the report cannot be swapped later.
  report_document_checksum: z
    .string({ error: "The report checksum is required" })
    .regex(/^[a-f0-9]{64}$/i, "Checksum must be a 64-character SHA-256 digest"),
  report_document_uri: z.string().trim().max(500).optional(),
});

/** Flow 2 Step 2: the custodian confirms the deed is sealed in the vault. */
export const CustodyConfirmationSchema = z.object({
  custodian_bank_name: z
    .string({ error: "Custodian bank name is required" })
    .trim()
    .min(3)
    .max(100),
  trust_deed_reference: z
    .string({ error: "Trust deed reference is required" })
    .trim()
    .min(4)
    .max(100),
  registry_office: z
    .string({ error: "Registry office is required" })
    .trim()
    .min(3)
    .max(150),
  vault_receipt_reference: z
    .string({ error: "Vault receipt reference is required" })
    .trim()
    .min(4)
    .max(100),
});

/** Flow 2 Step 3: mint the sub-fund and split the shares. */
export const TokenizationSchema = z.object({
  total_issued_shares: z
    .number({ error: "Total share count is required" })
    .positive("Share count must be greater than zero")
    .max(100_000_000, "Share count exceeds the platform ceiling"),
  nominal_price_per_share_etb: z
    .number({ error: "Nominal share price is required" })
    .positive("Share price must be greater than zero"),
  public_offering_percentage: z
    .number()
    .min(1, "At least 1% must be offered publicly")
    .max(100, "Cannot offer more than 100%")
    .default(60),
});

/** Primary market subscription against the crowdfunding pool. */
export const PrimarySubscriptionSchema = z.object({
  shares: z
    .number({ error: "Share quantity is required" })
    .positive("Share quantity must be greater than zero"),
  idempotency_key: z
    .string({ error: "System idempotency key is required" })
    .min(8)
    .max(255),
});

export type AssetAppraisalSubmission = z.infer<
  typeof AssetAppraisalSubmissionSchema
>;
export type CustodyConfirmation = z.infer<typeof CustodyConfirmationSchema>;
export type Tokenization = z.infer<typeof TokenizationSchema>;
export type PrimarySubscription = z.infer<typeof PrimarySubscriptionSchema>;
