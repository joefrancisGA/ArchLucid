import { SECURENOW_ACCELERATOR_INDEX_PATH } from "@/lib/product-line/securenow-accelerator-index-copy";
import { SECURENOW_OPERATOR_QUOTE_PACKET_HREF } from "@/lib/product-line/securenow-beta-sku-contents-copy";

export const SECURENOW_QUOTE_FEE_RECORDED_LINE =
  "Owner-approved SecureNow quote fees are recorded in the pricing philosophy (section 9). This page does not print dollar amounts." as const;

export const SECURENOW_QUOTE_FEE_ARCHITECTURE_BOUNDARY =
  "An ArchLucid Team or Professional subscription does not include SecureNow. Quote SecureNow separately." as const;

export const SECURENOW_QUOTE_FEE_LINKS = {
  quotePacket: SECURENOW_OPERATOR_QUOTE_PACKET_HREF,
  acceleratorIndex: SECURENOW_ACCELERATOR_INDEX_PATH,
} as const;
