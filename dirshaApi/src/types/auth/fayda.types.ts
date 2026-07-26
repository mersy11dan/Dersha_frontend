export interface FaydaVerificationResponse {
  verification_metadata: {
    fayda_transaction_id: string;
    timestamp: string;
    issuing_authority: string;
    digital_signature_rsa: string;
  };

  biometric_assessment: {
    face_match_passed: boolean;
    confidence_score_percentage: number;
    liveness_verified_by_partner: boolean;
  };

  demographic_profile: {
    fayda_number_masked: string;

    names: {
      english: string;
      amharic: string;
    };

    date_of_birth: string;
    gender: "MALE" | "FEMALE";
    phone_number_registered: string;
  };

  registered_address: {
    region: string;
    sub_city_zone: string;
    woreda: string;
    house_number: string;
  };

  photo_identity: {
    mime_type: string;
    base64_image_string: string;
  };
}
