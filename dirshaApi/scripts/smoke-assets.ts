/**
 * Flow 2 smoke test: appraisal -> custody -> tokenization -> primary subscription.
 * Requires the API to be running and `npm run seed` to have been executed.
 */
import { createHash, randomUUID } from "node:crypto";
import { DEMO_USERS, DEMO_PASSWORD } from "../src/database/seed";

const BASE = process.env.SMOKE_BASE_URL ?? "http://localhost:5000/api/v1";
let failures = 0;

function check(label: string, ok: boolean, detail?: unknown) {
  if (ok) console.log(`  PASS  ${label}`);
  else {
    failures += 1;
    console.error(`  FAIL  ${label}`, JSON.stringify(detail ?? "", null, 2));
  }
}

async function call(
  method: string,
  path: string,
  body?: unknown,
  token?: string,
) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    body: (await response.json().catch(() => ({}))) as any,
  };
}

async function login(email: string) {
  const result = await call("POST", "/auth/login", {
    email_address: email,
    password_plain: DEMO_PASSWORD,
  });
  return result.body?.data?.token as string;
}

const byKey = (key: string) => DEMO_USERS.find((u) => u.key === key)!;

async function main() {
  const managerToken = await login(byKey("manager").email);
  const hannaToken = await login(byKey("investorA").email);
  const ownerToken = await login(byKey("owner").email);

  check("fund manager can log in", Boolean(managerToken));
  check("investor can log in", Boolean(hannaToken));

  const runId = randomUUID().slice(0, 8);
  const checksum = createHash("sha256").update(`report-${runId}`).digest("hex");

  console.log("\n[authorisation]");
  const investorAttempt = await call(
    "POST",
    "/assets",
    {
      asset_name: `Unauthorised Tower ${runId}`,
      category: "REAL_ESTATE",
      physical_location_description: "Bole Road, Addis Ababa, near Edna Mall",
      original_owner_user_id: byKey("owner").userId,
      surveyor_name: "Test Surveyor",
      surveyor_ecma_license_ref: "ECMA-0001",
      appraised_value_etb: 1000,
      appraisal_date: "2026-01-15",
      report_document_checksum: createHash("sha256").update("nope").digest("hex"),
    },
    hannaToken,
  );
  check(
    "an investor cannot register an asset",
    investorAttempt.status === 403 &&
      investorAttempt.body?.code === "FUND_MANAGER_ONLY",
    investorAttempt.body,
  );

  console.log("\n[step 1: appraisal]");
  const appraisal = await call(
    "POST",
    "/assets",
    {
      asset_name: `Bole Commercial Tower ${runId}`,
      category: "REAL_ESTATE",
      physical_location_description:
        "Bole Sub-city, Woreda 03, Addis Ababa, adjacent to Edna Mall",
      original_owner_user_id: byKey("owner").userId,
      surveyor_name: "Yohannes Surveying PLC",
      surveyor_ecma_license_ref: `ECMA-SUR-${runId}`,
      appraised_value_etb: 12_000_000,
      appraisal_date: "2026-06-01",
      structural_status_notes: "Grade A structure, no defects noted.",
      report_document_checksum: checksum,
    },
    managerToken,
  );
  check("asset registered with appraisal", appraisal.status === 201, appraisal.body);
  check(
    "asset starts in APPRAISED state",
    appraisal.body?.data?.lifecycle_status === "APPRAISED",
    appraisal.body?.data,
  );
  const assetId = appraisal.body?.data?.asset_id;

  const reusedChecksum = await call(
    "POST",
    "/assets",
    {
      asset_name: `Clone Tower ${runId}`,
      category: "REAL_ESTATE",
      physical_location_description: "Kirkos Sub-city, Addis Ababa",
      original_owner_user_id: byKey("owner").userId,
      surveyor_name: "Yohannes Surveying PLC",
      surveyor_ecma_license_ref: `ECMA-SUR-${runId}`,
      appraised_value_etb: 12_000_000,
      appraisal_date: "2026-06-01",
      report_document_checksum: checksum,
    },
    managerToken,
  );
  check(
    "the same valuation report cannot back two assets",
    reusedChecksum.status === 409,
    reusedChecksum.body,
  );

  console.log("\n[tokenizing before custody]");
  const prematureMint = await call(
    "POST",
    `/assets/${assetId}/tokenize`,
    { total_issued_shares: 1000, nominal_price_per_share_etb: 100 },
    managerToken,
  );
  check(
    "cannot mint shares before custody is confirmed",
    prematureMint.status === 409 &&
      prematureMint.body?.code === "CUSTODY_NOT_CONFIRMED",
    prematureMint.body,
  );

  console.log("\n[step 2: custody]");
  const badCustody = await call(
    "POST",
    `/assets/${assetId}/custody`,
    {
      custodian_bank_name: "Awash Bank Custody Services",
      trust_deed_reference: "TD-INVALID-0001",
      registry_office: "Addis Ababa City Land Registry",
      vault_receipt_reference: "VLT-0001",
    },
    managerToken,
  );
  check(
    "custodian rejection surfaces as 422",
    badCustody.status === 422 &&
      badCustody.body?.code === "CUSTODY_VERIFICATION_FAILED",
    badCustody.body,
  );

  const custody = await call(
    "POST",
    `/assets/${assetId}/custody`,
    {
      custodian_bank_name: "Awash Bank Custody Services",
      trust_deed_reference: `TD-${runId}`,
      registry_office: "Addis Ababa City Land Registry",
      vault_receipt_reference: `VLT-${runId}`,
    },
    managerToken,
  );
  check("custody confirmed", custody.status === 201, custody.body);
  check(
    "asset advances to CUSTODY_CONFIRMED",
    custody.body?.data?.lifecycle_status === "CUSTODY_CONFIRMED",
    custody.body?.data,
  );

  console.log("\n[step 3: tokenization]");
  const mint = await call(
    "POST",
    `/assets/${assetId}/tokenize`,
    {
      total_issued_shares: 12000,
      nominal_price_per_share_etb: 1000,
      public_offering_percentage: 60,
    },
    managerToken,
  );
  check("sub-fund minted", mint.status === 201, mint.body);
  check(
    "60 percent goes to the public offering",
    mint.body?.data?.public_offering_shares === 7200,
    mint.body?.data,
  );
  check(
    "40 percent is retained by the owner",
    mint.body?.data?.owner_retained_shares === 4800,
    mint.body?.data,
  );
  check(
    "a vesting unlock date is set",
    Boolean(mint.body?.data?.owner_vesting_unlock_at),
    mint.body?.data,
  );

  const unlockAt = new Date(mint.body?.data?.owner_vesting_unlock_at);
  const monthsOut =
    (unlockAt.getFullYear() - new Date().getFullYear()) * 12 +
    (unlockAt.getMonth() - new Date().getMonth());
  check("vesting lock runs for six months", monthsOut === 6, { monthsOut });

  const subFundId = mint.body?.data?.sub_fund_id;

  const doubleMint = await call(
    "POST",
    `/assets/${assetId}/tokenize`,
    { total_issued_shares: 500, nominal_price_per_share_etb: 100 },
    managerToken,
  );
  check(
    "an asset cannot be tokenized twice",
    doubleMint.status === 409,
    doubleMint.body,
  );

  console.log("\n[owner vesting lock]");
  const ownerPortfolio = await call("GET", "/portfolio/holdings", undefined, ownerToken);
  if (ownerPortfolio.status === 404) {
    console.log("  SKIP  portfolio endpoint not built yet");
  } else {
    const holding = (ownerPortfolio.body?.data ?? []).find(
      (h: any) => h.sub_fund_id === subFundId,
    );
    check(
      "the owner's retained shares are fully locked",
      holding && holding.locked_shares === holding.shares_owned,
      holding,
    );
  }

  console.log("\n[primary subscription]");
  const beforeBalance = await call("GET", "/wallet/balance", undefined, hannaToken);
  const cashBefore = beforeBalance.body?.data?.available_balance_etb;

  const subscribe = await call(
    "POST",
    `/assets/sub-funds/${subFundId}/subscribe`,
    { shares: 100, idempotency_key: `SUB-${randomUUID()}` },
    hannaToken,
  );
  check("primary subscription settles", subscribe.status === 201, subscribe.body);
  check(
    "investor receives the shares",
    subscribe.body?.data?.shares_acquired === 100,
    subscribe.body?.data,
  );
  check(
    "cost is shares times the nominal price",
    subscribe.body?.data?.total_cost_etb === 100_000,
    subscribe.body?.data,
  );
  check(
    "the offering pool shrinks accordingly",
    subscribe.body?.data?.offering_shares_remaining === 7100,
    subscribe.body?.data,
  );

  const afterBalance = await call("GET", "/wallet/balance", undefined, hannaToken);
  check(
    "the investor's cash is debited by exactly the cost",
    Math.round((cashBefore - afterBalance.body?.data?.available_balance_etb) * 100) ===
      10_000_000,
    {
      before: cashBefore,
      after: afterBalance.body?.data?.available_balance_etb,
    },
  );

  const overSubscribe = await call(
    "POST",
    `/assets/sub-funds/${subFundId}/subscribe`,
    { shares: 999_999, idempotency_key: `SUB-${randomUUID()}` },
    hannaToken,
  );
  check(
    "cannot subscribe beyond the remaining offering",
    overSubscribe.body?.code === "INSUFFICIENT_OFFERING_REMAINING",
    overSubscribe.body,
  );

  console.log(
    failures === 0
      ? "\nAll Flow 2 checks passed.\n"
      : `\n${failures} check(s) failed.\n`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
