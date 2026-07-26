import { z } from "zod";

const uuid = z.string().uuid("Must be a valid identifier.");

export const BasketMintSchema = z.object({
  basket_name: z
    .string()
    .trim()
    .min(3, "Give the basket a name of at least 3 characters.")
    .max(100),
  // The supply the basket is divided into. A larger supply means a smaller
  // per-share NAV, which is what makes an expensive basket affordable.
  total_basket_shares: z
    .number()
    .positive("A basket must issue at least some shares.")
    .max(1_000_000, "A basket cannot issue more than 1,000,000 shares.")
    .default(100),
  constituents: z
    .array(
      z.object({
        sub_fund_id: uuid,
        shares_allocated: z
          .number()
          .positive("Allocate a positive number of shares."),
      }),
    )
    .min(2, "A basket needs at least two constituent sub-funds to diversify.")
    .max(20, "A basket cannot hold more than 20 sub-funds."),
  idempotency_key: z.string().min(8).max(255),
});

export const BasketListingSchema = z.object({
  sale_mode: z.enum(["WHOLE_BASKET_ONLY", "FRACTIONAL_POOL"]),
  total_basket_shares_listed: z
    .number()
    .positive("List a positive number of basket shares."),
  price_per_unit_etb: z.number().positive("Set a price above zero."),
  idempotency_key: z.string().min(8).max(255),
});

export const BasketPurchaseSchema = z.object({
  basket_shares: z.number().positive("Buy a positive number of basket shares."),
  idempotency_key: z.string().min(8).max(255),
});

export type BasketMint = z.infer<typeof BasketMintSchema>;
export type BasketListing = z.infer<typeof BasketListingSchema>;
export type BasketPurchase = z.infer<typeof BasketPurchaseSchema>;
