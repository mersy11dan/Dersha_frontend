import path from "node:path";
import dotenv from "dotenv";

// Loaded here, at the top of the dependency graph, so that any module importing
// this config sees a populated process.env regardless of import ordering.
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable "${name}". Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

function numeric(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw || raw.trim() === "") return fallback;
  const parsed = Number(raw);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable "${name}" must be a number.`);
  }
  return parsed;
}

export const env = {
  port: numeric("PORT", 5000),
  nodeEnv: optional("NODE_ENV", "development"),
  corsOrigin: optional("CORS_ORIGIN", "http://localhost:5173"),

  db: {
    host: optional("DB_HOST", "127.0.0.1"),
    port: numeric("DB_PORT", 3306),
    user: optional("DB_USER", "root"),
    password: optional("DB_PASSWORD", ""),
    database: optional("DB_NAME", "dirsha_db"),
  },

  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: optional("JWT_EXPIRES_IN", "7d"),

  // MOCK routes every partner call to a local simulator; LIVE uses real endpoints.
  partnerMode: optional("PARTNER_MODE", "MOCK").toUpperCase() as "MOCK" | "LIVE",

  fayda: {
    baseUrl: optional("FAYDA_API_BASE_URL", "https://id.gov.et"),
    apiKey: optional("FAYDA_PARTNER_API_KEY", ""),
    minConfidence: numeric("FAYDA_MIN_CONFIDENCE", 95),
  },

  payments: {
    baseUrl: optional("PAYMENT_GATEWAY_BASE_URL", ""),
    apiKey: optional("PAYMENT_GATEWAY_API_KEY", ""),
    webhookSecret: optional("PAYMENT_WEBHOOK_SECRET", "dev-webhook-secret"),
  },

  custodian: {
    sftpHost: optional("CUSTODIAN_SFTP_HOST", ""),
    sftpUser: optional("CUSTODIAN_SFTP_USER", ""),
    sftpPassword: optional("CUSTODIAN_SFTP_PASSWORD", ""),
    statementDir: optional("CUSTODIAN_STATEMENT_DIR", "./fixtures/mt940"),
  },

  economics: {
    withholdingTaxRate: numeric("DIVIDEND_WITHHOLDING_TAX_RATE", 0.1),
    creatorRoyaltyRate: numeric("CREATOR_ROYALTY_RATE", 0.005),
    ammHaircut: numeric("AMM_LIQUIDITY_HAIRCUT", 0.12),
    ammNoMatchWindowSeconds: numeric("AMM_NO_MATCH_WINDOW_SECONDS", 60),
    ownerVestingLockMonths: numeric("OWNER_VESTING_LOCK_MONTHS", 6),
  },

  reconciliation: {
    cron: optional("RECONCILIATION_CRON", "0 4 * * *"),
    timezone: optional("RECONCILIATION_TIMEZONE", "Africa/Addis_Ababa"),
  },
} as const;

export const isMockMode = env.partnerMode !== "LIVE";
