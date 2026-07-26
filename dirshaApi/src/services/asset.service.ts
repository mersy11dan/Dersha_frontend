import { randomUUID } from "node:crypto";
import pool from "../database/database.config";
import { withTransaction } from "../database/transactionManager";
import { SecuritiesRepository } from "../repository/SecuritiesRepository";
import { WalletRepository } from "../repository/WalletRespository";
import { recordAudit } from "../repository/AuditRepository";
import {
  AssetAppraisalSubmission,
  CustodyConfirmation,
  Tokenization,
  PrimarySubscription,
} from "../schemas/asset.schema";
import { custodianAdapter } from "../integrations/custodian.adapter";
import { SYSTEM_ACCOUNTS } from "../constants/systemAccounts";
import { ApiError } from "../utils/ApiError";
import { env } from "../config/env";
import { cashLiteral, roundCash, roundShares, shareLiteral, toCash, toShares } from "../utils/money";
import { RequestContext } from "../utils/requestContext";

export class AssetService {
  /**
   * Flow 2 Step 1. Registers the asset alongside its independent appraisal.
   *
   * The asset is created in APPRAISED state: it exists on the platform but has
   * no custody and therefore cannot be tokenized yet.
   */
  async submitAppraisal(
    fundManagerId: string,
    payload: AssetAppraisalSubmission,
    context: Partial<RequestContext> = {},
  ) {
    const [owner]: any = await pool.execute(
      "SELECT user_id, account_status FROM users WHERE user_id = ? LIMIT 1",
      [payload.original_owner_user_id],
    );

    if (owner.length === 0) {
      throw ApiError.badRequest(
        "OWNER_NOT_FOUND",
        "The nominated asset owner does not exist.",
      );
    }

    if (owner[0].account_status !== "ACTIVE_VERIFIED") {
      throw ApiError.badRequest(
        "OWNER_NOT_VERIFIED",
        "The asset owner must complete identity verification before their asset can be listed.",
      );
    }

    // The checksum is unique across the platform, so the same signed report
    // cannot be reused to justify two different assets.
    const [duplicate]: any = await pool.execute(
      "SELECT appraisal_id FROM asset_appraisals WHERE report_document_checksum = ? LIMIT 1",
      [payload.report_document_checksum],
    );

    if (duplicate.length > 0) {
      throw ApiError.conflict(
        "APPRAISAL_REPORT_ALREADY_USED",
        "This valuation report has already been submitted for another asset.",
      );
    }

    const assetId = randomUUID();
    const appraisalId = randomUUID();

    await withTransaction(async (connection) => {
      await connection.execute(
        `INSERT INTO assets_master
          (asset_id, asset_name, category, lifecycle_status, physical_location_description,
           independent_appraised_value_etb, last_appraisal_date, original_owner_user_id)
         VALUES (?, ?, ?, 'APPRAISED', ?, ?, ?, ?)`,
        [
          assetId,
          payload.asset_name,
          payload.category,
          payload.physical_location_description,
          cashLiteral(payload.appraised_value_etb),
          payload.appraisal_date,
          payload.original_owner_user_id,
        ],
      );

      await connection.execute(
        `INSERT INTO asset_appraisals
          (appraisal_id, asset_id, surveyor_name, surveyor_ecma_license_ref,
           appraised_value_etb, appraisal_date, structural_status_notes,
           report_document_checksum, report_document_uri, is_current)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          appraisalId,
          assetId,
          payload.surveyor_name,
          payload.surveyor_ecma_license_ref,
          cashLiteral(payload.appraised_value_etb),
          payload.appraisal_date,
          payload.structural_status_notes ?? null,
          payload.report_document_checksum.toLowerCase(),
          payload.report_document_uri ?? null,
        ],
      );

      await recordAudit(connection, {
        userId: fundManagerId,
        category: "ADMIN",
        eventType: "ASSET_APPRAISAL_SUBMITTED",
        referenceId: assetId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          asset_name: payload.asset_name,
          appraised_value_etb: payload.appraised_value_etb,
          surveyor: payload.surveyor_ecma_license_ref,
        },
      });
    });

    return {
      asset_id: assetId,
      appraisal_id: appraisalId,
      lifecycle_status: "APPRAISED",
      next_step: "CUSTODY_CONFIRMATION",
    };
  }

  /**
   * Flow 2 Step 2. Verifies with the custodian that the legal title is sealed
   * in the vault. Without this the asset can never be tokenized, which is what
   * stops shares being minted against an asset nobody controls.
   */
  async confirmCustody(
    fundManagerId: string,
    assetId: string,
    payload: CustodyConfirmation,
    context: Partial<RequestContext> = {},
  ) {
    const asset = await this.requireAsset(assetId);

    if (asset.lifecycle_status !== "APPRAISED") {
      throw ApiError.conflict(
        "INVALID_ASSET_STATE",
        `Custody can only be confirmed for an appraised asset. This asset is ${asset.lifecycle_status}.`,
      );
    }

    const verification = await custodianAdapter.confirmCustody({
      assetId,
      custodianBankName: payload.custodian_bank_name,
      trustDeedReference: payload.trust_deed_reference,
      vaultReceiptReference: payload.vault_receipt_reference,
    });

    if (!verification.confirmed) {
      throw ApiError.unprocessable(
        "CUSTODY_VERIFICATION_FAILED",
        verification.reason ?? "The custodian could not confirm custody.",
      );
    }

    const custodyId = randomUUID();

    await withTransaction(async (connection) => {
      await connection.execute(
        `INSERT INTO custody_confirmations
          (custody_id, asset_id, custodian_bank_name, trust_deed_reference,
           registry_office, vault_receipt_reference, custody_verification_token)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          custodyId,
          assetId,
          payload.custodian_bank_name,
          payload.trust_deed_reference,
          payload.registry_office,
          payload.vault_receipt_reference,
          verification.verificationToken,
        ],
      );

      await connection.execute(
        `UPDATE assets_master
         SET custodian_bank_name = ?, custodian_trust_deed_reference = ?,
             lifecycle_status = 'CUSTODY_CONFIRMED'
         WHERE asset_id = ?`,
        [payload.custodian_bank_name, payload.trust_deed_reference, assetId],
      );

      await recordAudit(connection, {
        userId: fundManagerId,
        category: "ADMIN",
        eventType: "ASSET_CUSTODY_CONFIRMED",
        referenceId: assetId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          custodian: payload.custodian_bank_name,
          trust_deed_reference: payload.trust_deed_reference,
        },
      });
    });

    return {
      asset_id: assetId,
      custody_id: custodyId,
      lifecycle_status: "CUSTODY_CONFIRMED",
      next_step: "TOKENIZATION",
    };
  }

  /**
   * Flow 2 Step 3. Mints the sub-fund and splits the shares.
   *
   * The public tranche goes to the crowdfunding pool for primary subscription;
   * the owner's retained tranche is credited to them but vesting-locked for six
   * months, so they cannot mint shares and immediately dump them on retail
   * buyers.
   */
  async tokenize(
    fundManagerId: string,
    assetId: string,
    payload: Tokenization,
    context: Partial<RequestContext> = {},
  ) {
    const asset = await this.requireAsset(assetId);

    if (asset.lifecycle_status === "TOKENIZED") {
      throw ApiError.conflict(
        "ASSET_ALREADY_TOKENIZED",
        "This asset has already been tokenized.",
      );
    }

    if (asset.lifecycle_status !== "CUSTODY_CONFIRMED") {
      throw ApiError.conflict(
        "CUSTODY_NOT_CONFIRMED",
        "Custody must be confirmed by the custodian bank before shares can be minted.",
      );
    }

    const totalShares = roundShares(payload.total_issued_shares);
    const publicShares = roundShares(
      (totalShares * payload.public_offering_percentage) / 100,
    );
    const ownerShares = roundShares(totalShares - publicShares);

    const unlockAt = new Date();
    unlockAt.setMonth(unlockAt.getMonth() + env.economics.ownerVestingLockMonths);

    const subFundId = randomUUID();
    const issuanceKey = `ISSUE-${subFundId}`;

    await withTransaction(async (connection) => {
      const securities = new SecuritiesRepository(connection);

      await connection.execute(
        `INSERT INTO sub_funds
          (sub_fund_id, asset_id, sub_fund_status, total_issued_shares,
           nominal_price_per_share_etb, current_net_asset_value_nav_etb)
         VALUES (?, ?, 'PRIMARY_CROWDFUNDING', ?, ?, ?)`,
        [
          subFundId,
          assetId,
          shareLiteral(totalShares),
          cashLiteral(payload.nominal_price_per_share_etb),
          cashLiteral(payload.nominal_price_per_share_etb),
        ],
      );

      // Public tranche into the crowdfunding pool.
      await securities.creditShares(
        connection,
        SYSTEM_ACCOUNTS.PRIMARY_CROWDFUNDING_POOL,
        subFundId,
        publicShares,
      );
      await securities.recordLedgerEntry(connection, {
        subFundId,
        transactionType: "PRIMARY_ISSUANCE",
        senderUserId: null,
        receiverUserId: SYSTEM_ACCOUNTS.PRIMARY_CROWDFUNDING_POOL,
        shares: publicShares,
        pricePerShareEtb: payload.nominal_price_per_share_etb,
        idempotencyKey: `${issuanceKey}-PUBLIC`,
      });

      if (ownerShares > 0) {
        await securities.creditShares(
          connection,
          asset.original_owner_user_id,
          subFundId,
          ownerShares,
        );

        // Locked immediately, so the retained tranche is unsellable until the
        // vesting period elapses.
        await securities.lockShares(
          connection,
          asset.original_owner_user_id,
          subFundId,
          ownerShares,
        );

        await connection.execute(
          `INSERT INTO share_vesting_locks
            (vesting_id, user_id, sub_fund_id, shares_locked, lock_reason, unlock_at)
           VALUES (?, ?, ?, ?, 'OWNER_PRIMARY_VESTING', ?)`,
          [
            randomUUID(),
            asset.original_owner_user_id,
            subFundId,
            shareLiteral(ownerShares),
            unlockAt,
          ],
        );

        await securities.recordLedgerEntry(connection, {
          subFundId,
          transactionType: "PRIMARY_ISSUANCE",
          senderUserId: null,
          receiverUserId: asset.original_owner_user_id,
          shares: ownerShares,
          pricePerShareEtb: payload.nominal_price_per_share_etb,
          idempotencyKey: `${issuanceKey}-OWNER`,
        });
      }

      await connection.execute(
        "UPDATE assets_master SET lifecycle_status = 'TOKENIZED' WHERE asset_id = ?",
        [assetId],
      );

      await recordAudit(connection, {
        userId: fundManagerId,
        category: "ADMIN",
        eventType: "ASSET_TOKENIZED",
        referenceId: subFundId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: {
          asset_id: assetId,
          total_shares: totalShares,
          public_shares: publicShares,
          owner_shares: ownerShares,
          vesting_unlock_at: unlockAt.toISOString(),
        },
      });
    });

    return {
      sub_fund_id: subFundId,
      asset_id: assetId,
      total_issued_shares: totalShares,
      public_offering_shares: publicShares,
      owner_retained_shares: ownerShares,
      owner_vesting_unlock_at: unlockAt.toISOString(),
      nominal_price_per_share_etb: payload.nominal_price_per_share_etb,
      sub_fund_status: "PRIMARY_CROWDFUNDING",
    };
  }

  /**
   * Primary market subscription: an investor buys unsold shares from the
   * crowdfunding pool at the nominal price. Once the pool empties the sub-fund
   * graduates to secondary trading.
   */
  async subscribePrimary(
    userId: string,
    subFundId: string,
    payload: PrimarySubscription,
    context: Partial<RequestContext> = {},
  ) {
    const shares = roundShares(payload.shares);

    return withTransaction(async (connection) => {
      const securities = new SecuritiesRepository(connection);
      const wallets = new WalletRepository(connection);

      const [rows]: any = await connection.execute(
        `SELECT sf.sub_fund_id, sf.sub_fund_status, sf.nominal_price_per_share_etb,
                a.asset_name
         FROM sub_funds sf
         JOIN assets_master a ON a.asset_id = sf.asset_id
         WHERE sf.sub_fund_id = ? FOR UPDATE`,
        [subFundId],
      );

      if (rows.length === 0) {
        throw ApiError.notFound("SUB_FUND_NOT_FOUND", "No such sub-fund.");
      }

      const subFund = rows[0];

      if (subFund.sub_fund_status !== "PRIMARY_CROWDFUNDING") {
        throw ApiError.conflict(
          "PRIMARY_OFFERING_CLOSED",
          "This offering has closed. Buy on the secondary market instead.",
        );
      }

      const price = toCash(subFund.nominal_price_per_share_etb);
      const cost = roundCash(shares * price);

      const poolBalance = await securities.lockBalance(
        connection,
        SYSTEM_ACCOUNTS.PRIMARY_CROWDFUNDING_POOL,
        subFundId,
      );

      if (poolBalance.free < shares) {
        throw ApiError.badRequest(
          "INSUFFICIENT_OFFERING_REMAINING",
          `Only ${poolBalance.free} shares remain in this offering.`,
        );
      }

      // Cash out of the investor, shares out of the pool: both or neither.
      await wallets.debitAvailable(connection, userId, cost);
      await wallets.creditAvailable(
        connection,
        SYSTEM_ACCOUNTS.PRIMARY_CROWDFUNDING_POOL,
        cost,
      );

      await securities.transferShares(connection, {
        subFundId,
        fromUserId: SYSTEM_ACCOUNTS.PRIMARY_CROWDFUNDING_POOL,
        toUserId: userId,
        shares,
        pricePerShareEtb: price,
        transactionType: "PRIMARY_ISSUANCE",
        idempotencyKey: payload.idempotency_key,
      });

      const transactionId = randomUUID();
      await wallets.recordTransaction(connection, {
        transactionId,
        userId,
        type: "PRIMARY_SUBSCRIPTION",
        grossAmountEtb: cost,
        netAmountEtb: cost,
        status: "SETTLED",
        idempotencyKey: payload.idempotency_key,
        settledAt: new Date(),
      });

      const remaining = roundShares(poolBalance.free - shares);
      if (remaining <= 0) {
        await connection.execute(
          "UPDATE sub_funds SET sub_fund_status = 'ACTIVE_TRADING' WHERE sub_fund_id = ?",
          [subFundId],
        );
      }

      await recordAudit(connection, {
        userId,
        category: "TRADING",
        eventType: "PRIMARY_SUBSCRIPTION",
        referenceId: subFundId,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
        payload: { shares, price_per_share_etb: price, cost_etb: cost },
      });

      return {
        sub_fund_id: subFundId,
        asset_name: subFund.asset_name,
        shares_acquired: shares,
        price_per_share_etb: price,
        total_cost_etb: cost,
        offering_shares_remaining: remaining,
        sub_fund_status: remaining <= 0 ? "ACTIVE_TRADING" : "PRIMARY_CROWDFUNDING",
      };
    });
  }

  async getAsset(assetId: string) {
    const asset = await this.requireAsset(assetId);

    const [appraisals]: any = await pool.execute(
      `SELECT appraisal_id, surveyor_name, surveyor_ecma_license_ref, appraised_value_etb,
              appraisal_date, structural_status_notes, report_document_checksum, is_current
       FROM asset_appraisals WHERE asset_id = ? ORDER BY appraisal_date DESC`,
      [assetId],
    );

    const [custody]: any = await pool.execute(
      `SELECT custody_id, custodian_bank_name, trust_deed_reference, registry_office,
              vault_receipt_reference, confirmed_at
       FROM custody_confirmations WHERE asset_id = ? LIMIT 1`,
      [assetId],
    );

    const [subFunds]: any = await pool.execute(
      `SELECT sub_fund_id, sub_fund_status, total_issued_shares,
              nominal_price_per_share_etb, current_net_asset_value_nav_etb
       FROM sub_funds WHERE asset_id = ?`,
      [assetId],
    );

    return {
      ...asset,
      independent_appraised_value_etb: toCash(asset.independent_appraised_value_etb),
      appraisals: appraisals.map((row: any) => ({
        ...row,
        appraised_value_etb: toCash(row.appraised_value_etb),
        is_current: Boolean(row.is_current),
      })),
      custody: custody[0] ?? null,
      sub_funds: subFunds.map((row: any) => ({
        ...row,
        total_issued_shares: toShares(row.total_issued_shares),
        nominal_price_per_share_etb: toCash(row.nominal_price_per_share_etb),
        current_net_asset_value_nav_etb: toCash(row.current_net_asset_value_nav_etb),
      })),
    };
  }

  async listAssets(filters: { lifecycle_status?: string } = {}) {
    const clauses: string[] = [];
    const params: any[] = [];

    if (filters.lifecycle_status) {
      clauses.push("a.lifecycle_status = ?");
      params.push(filters.lifecycle_status);
    }

    const [rows]: any = await pool.execute(
      `SELECT a.asset_id, a.asset_name, a.category, a.lifecycle_status,
              a.physical_location_description, a.independent_appraised_value_etb,
              a.last_appraisal_date, a.custodian_bank_name, a.original_owner_user_id,
              sf.sub_fund_id, sf.sub_fund_status
       FROM assets_master a
       LEFT JOIN sub_funds sf ON sf.asset_id = a.asset_id
       ${clauses.length ? `WHERE ${clauses.join(" AND ")}` : ""}
       ORDER BY a.created_at DESC`,
      params,
    );

    return rows.map((row: any) => ({
      ...row,
      independent_appraised_value_etb: toCash(row.independent_appraised_value_etb),
    }));
  }

  private async requireAsset(assetId: string) {
    const [rows]: any = await pool.execute(
      "SELECT * FROM assets_master WHERE asset_id = ? LIMIT 1",
      [assetId],
    );

    if (rows.length === 0) {
      throw ApiError.notFound("ASSET_NOT_FOUND", "No such asset.");
    }

    return rows[0];
  }
}

export const assetService = new AssetService();
