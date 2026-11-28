import {
  SECURENOW_READER_INVENTORY_POSTURE_LEAD,
  SECURENOW_READER_INVENTORY_POSTURE_PULL_LINE,
} from "@/lib/product-line/securenow-reader-inventory-posture-honesty-copy";

export type SecureNowReaderInventoryPostureHonesty = { readonly lead: string; readonly pullLine: string };

export function resolveSecureNowReaderInventoryPostureHonesty(): SecureNowReaderInventoryPostureHonesty {
  return { lead: SECURENOW_READER_INVENTORY_POSTURE_LEAD, pullLine: SECURENOW_READER_INVENTORY_POSTURE_PULL_LINE };
}
