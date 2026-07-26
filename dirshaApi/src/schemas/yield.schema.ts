import { z } from "zod";

export const YIELD_CATEGORIES = [
  "REAL_ESTATE_RENT",
  "TERMINAL_LIQUIDATION",
  "LOGISTICS_FLEET_LEASE",
  "MICRO_BUSINESS_PROFIT",
] as const;

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the YYYY-MM-DD format.");

export const YieldDistributionSchema = z
  .object({
    yield_category: z.enum(YIELD_CATEGORIES),
    gross_revenue_collected_etb: z
      .number()
      .positive("Report the revenue actually collected for the period."),
    // Operating costs and the platform's cut come off the top; what remains is
    // what investors have a claim on.
    opex_deductions_etb: z.number().min(0).default(0),
    platform_fees_retained_etb: z.number().min(0).default(0),
    reporting_period_start: isoDate,
    reporting_period_end: isoDate,
    idempotency_key: z.string().min(8).max(255),
  })
  .refine(
    (value) =>
      value.opex_deductions_etb + value.platform_fees_retained_etb <
      value.gross_revenue_collected_etb,
    {
      message:
        "Deductions and fees must leave something to distribute to investors.",
      path: ["opex_deductions_etb"],
    },
  )
  .refine(
    (value) => value.reporting_period_start <= value.reporting_period_end,
    {
      message: "The reporting period must start before it ends.",
      path: ["reporting_period_start"],
    },
  );

export const TradingHaltSchema = z.object({
  halted: z.boolean(),
  reason: z.string().trim().max(255).optional(),
});

export type YieldDistribution = z.infer<typeof YieldDistributionSchema>;
export type TradingHalt = z.infer<typeof TradingHaltSchema>;
