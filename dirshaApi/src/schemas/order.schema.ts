import { z } from "zod";

export const OrderPlacementSchema = z.object({
  sub_fund_id: z
    .string({ error: "Sub-fund is required" })
    .uuid("Invalid sub-fund id"),
  direction: z.enum(["BUY", "SELL"], { error: "Choose BUY or SELL" }),
  order_type: z.enum(["LIMIT", "MARKET"]).default("LIMIT"),
  total_shares_ordered: z
    .number({ error: "Share quantity is required" })
    .positive("Share quantity must be greater than zero")
    .max(100_000_000, "Share quantity exceeds the platform ceiling"),
  target_price_per_share_etb: z
    .number({ error: "Price per share is required" })
    .positive("Price must be greater than zero")
    .max(10_000_000, "Price exceeds the platform ceiling"),
  idempotency_key: z
    .string({ error: "System idempotency key is required" })
    .min(8)
    .max(255),
});

export type OrderPlacement = z.infer<typeof OrderPlacementSchema>;
