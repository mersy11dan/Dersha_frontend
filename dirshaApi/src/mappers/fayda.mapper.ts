import { FaydaKYCRequest } from "../schemas/user.schema";

export type faydaUserRequestType = {
  faydaIdNumber: string;
  liveSelfieBase64: string;
  livenessPassed?: boolean;
};

export type { FaydaKYCRequest };

export class FaydaMapper {
  static toFaydaRequest(request: faydaUserRequestType): FaydaKYCRequest {
    return {
      fayda_id_number: request.faydaIdNumber,
      live_selfie_base64: request.liveSelfieBase64,
      liveness_passed: request.livenessPassed ?? true,
    };
  }
}
