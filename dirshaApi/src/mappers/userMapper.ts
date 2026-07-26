import {
  UserProfileResponse,
  UserRegistrationRequest,
} from "../schemas/user.schema";

export type UserResponse = {
  userId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  faydaIdNumber: string | null;
  dateOfBirth: Date | null;
  accountStatus:
    | "PENDING_KYC"
    | "ACTIVE_VERIFIED"
    | "SUSPENDED_FRAUD"
    | "FLAGGED_AML";
  isDiasporaAccount: boolean;
  riskScore: number;
  createdAt: Date;
  updatedAt: Date;
};

export type UserRequest = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  isDiasporaAccount: boolean;
};

export class UserMapper {
  static toResponse(user: UserProfileResponse): UserResponse {
    return {
      userId: user.user_id,
      fullName: user.full_name_raw,
      email: user.email_address,
      phoneNumber: user.phone_number_eth,
      faydaIdNumber: user.fayda_id_number_masked,
      dateOfBirth: user.date_of_birth,
      accountStatus: user.account_status,
      isDiasporaAccount: user.is_diaspora_account,
      riskScore: user.risk_score_matrix,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    };
  }

  static toRequest(user: UserRequest): UserRegistrationRequest {
    return {
      email_address: user.email,
      full_name_raw: user.fullName,
      is_diaspora_account: user.isDiasporaAccount,
      password_plain: user.password,
      phone_number_eth: user.phoneNumber,
    };
  }

  static toResponseList(users: UserProfileResponse[]): UserResponse[] {
    return users.map(this.toResponse);
  }
}

export function mapUserResponseToUser(user: UserResponse): UserProfileResponse {
  return {
    user_id: user.userId,
    full_name_raw: user.fullName,
    email_address: user.email,
    phone_number_eth: user.phoneNumber,
    fayda_id_number_masked: user.faydaIdNumber,
    date_of_birth: user.dateOfBirth,
    account_status: user.accountStatus,
    is_diaspora_account: user.isDiasporaAccount,
    risk_score_matrix: user.riskScore,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}
