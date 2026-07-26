import { randomUUID } from "node:crypto";
import {
  UserRegistrationRequest,
  UserProfileResponse,
} from "../schemas/user.schema";
import { ParentRepository, SqlExecutor } from "./ParentRepository";
import {
  ChangeResponseType,
  FetchedListReponseType,
  FetchedResponseType,
} from "../types/return.types";

/** Columns safe to return to a client. Never includes password_hash. */
const PUBLIC_COLUMNS = `
  user_id,
  full_name_raw,
  email_address,
  phone_number_eth,
  fayda_id_number_masked,
  date_of_birth,
  account_status,
  is_diaspora_account,
  risk_score_matrix,
  created_at,
  updated_at
`;

export interface UserKycUpdate {
  userId: string;
  fayda_id_number_masked: string;
  fayda_id_hash: string;
  fayda_biometric_token_hash: string;
  date_of_birth: string;
  account_status: "PENDING_KYC" | "ACTIVE_VERIFIED" | "SUSPENDED_FRAUD" | "FLAGGED_AML";
  risk_score_matrix?: number;
}

/** A registration payload whose password has already been hashed by the service. */
export interface UserInsertRecord
  extends Omit<UserRegistrationRequest, "password_plain"> {
  password_hash: string;
}

export class UserRepository extends ParentRepository<
  UserInsertRecord,
  UserKycUpdate,
  FetchedListReponseType<UserProfileResponse>
> {
  constructor(connection: SqlExecutor) {
    super(connection);
  }

  /**
   * Inserts the Step 1 onboarding record as PENDING_KYC.
   *
   * The user_id is generated here rather than relying on the column's uuid()
   * default, because MySQL returns no usable insertId for CHAR(36) keys and the
   * caller needs the id to provision the wallet in the same transaction.
   */
  async saveData(data: UserInsertRecord): Promise<ChangeResponseType<string>> {
    try {
      const userId = randomUUID();

      const query = `
        INSERT INTO users (
          user_id,
          full_name_raw,
          email_address,
          phone_number_eth,
          password_hash,
          account_status,
          is_diaspora_account
        ) VALUES (?, ?, ?, ?, ?, 'PENDING_KYC', ?)
      `;

      await this.connection.execute(query, [
        userId,
        data.full_name_raw,
        data.email_address,
        data.phone_number_eth,
        data.password_hash,
        data.is_diaspora_account ? 1 : 0,
      ]);

      return { success: true, data: userId };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  /** Applies the verified Fayda eKYC profile and flips the account status. */
  async updateData(data: UserKycUpdate): Promise<ChangeResponseType> {
    try {
      const query = `
        UPDATE users
        SET
          fayda_id_number_masked = ?,
          fayda_id_hash = ?,
          fayda_biometric_token_hash = ?,
          date_of_birth = ?,
          account_status = ?,
          risk_score_matrix = COALESCE(?, risk_score_matrix),
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `;

      await this.connection.execute(query, [
        data.fayda_id_number_masked,
        data.fayda_id_hash,
        data.fayda_biometric_token_hash,
        data.date_of_birth,
        data.account_status,
        data.risk_score_matrix ?? null,
        data.userId,
      ]);

      return { success: true };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async findAll(): Promise<FetchedListReponseType<UserProfileResponse>> {
    try {
      const [rows]: any = await this.connection.query(
        `SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY created_at DESC`,
      );
      return { success: true, data: rows as UserProfileResponse[] };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async findById(
    userId: string,
  ): Promise<FetchedResponseType<UserProfileResponse>> {
    try {
      const [rows]: any = await this.connection.execute(
        `SELECT ${PUBLIC_COLUMNS} FROM users WHERE user_id = ? LIMIT 1`,
        [userId],
      );
      return { success: true, data: rows[0] };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async findByEmail(
    email: string,
  ): Promise<FetchedResponseType<UserProfileResponse>> {
    try {
      const [rows]: any = await this.connection.execute(
        `SELECT ${PUBLIC_COLUMNS} FROM users WHERE email_address = ? LIMIT 1`,
        [email],
      );
      return { success: true, data: rows[0] };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  async findByPhone(
    phone: string,
  ): Promise<FetchedResponseType<UserProfileResponse>> {
    try {
      const [rows]: any = await this.connection.execute(
        `SELECT ${PUBLIC_COLUMNS} FROM users WHERE phone_number_eth = ? LIMIT 1`,
        [phone],
      );
      return { success: true, data: rows[0] };
    } catch (err) {
      return { success: false, error: err };
    }
  }

  /**
   * Login-only lookup that includes the password hash.
   * Kept separate from findByEmail so the hash can never leak into a response
   * body by accident.
   */
  async findCredentialsByEmail(
    email: string,
  ): Promise<{ user_id: string; email_address: string; password_hash: string; account_status: string } | null> {
    const [rows]: any = await this.connection.execute(
      `SELECT user_id, email_address, password_hash, account_status
       FROM users WHERE email_address = ? LIMIT 1`,
      [email],
    );
    return rows[0] ?? null;
  }

  /** Returns true when the email or phone is already taken by another account. */
  async identityExists(email: string, phone: string): Promise<boolean> {
    const [rows]: any = await this.connection.execute(
      `SELECT 1 FROM users WHERE email_address = ? OR phone_number_eth = ? LIMIT 1`,
      [email, phone],
    );
    return rows.length > 0;
  }

  /** Guards against the same national ID being bound to two accounts. */
  async faydaIdExists(faydaIdHash: string): Promise<boolean> {
    const [rows]: any = await this.connection.execute(
      `SELECT 1 FROM users WHERE fayda_id_hash = ? LIMIT 1`,
      [faydaIdHash],
    );
    return rows.length > 0;
  }
}
