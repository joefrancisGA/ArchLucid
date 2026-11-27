import {
  SECURENOW_BETA_SKU_CONTENTS_EXCLUDES,
  SECURENOW_BETA_SKU_CONTENTS_INCLUDES,
  SECURENOW_OPERATOR_QUOTE_PACKET_HREF,
} from "@/lib/product-line/securenow-beta-sku-contents-copy";
import { SECURENOW_ARCHITECTURE_SUBSCRIPTION_BOUNDARY } from "@/lib/marketing/securenow-public-commercial-packaging-copy";

export const SECURENOW_BILLING_COMPARISON_HEADING = "ArchLucid plans vs SecureNow SKUs" as const;

export const SECURENOW_BILLING_COMPARISON_LEAD = SECURENOW_ARCHITECTURE_SUBSCRIPTION_BOUNDARY;

export const SECURENOW_BILLING_COMPARISON_ARCHLUCID_COLUMN = "ArchLucid checkout includes" as const;

export const SECURENOW_BILLING_COMPARISON_SECURENOW_COLUMN = "SecureNow (quoted separately)" as const;

export const SECURENOW_BILLING_COMPARISON_ARCHLUCID_ROWS = [
  "Architecture review workspace, finalize, and buyer export paths",
  "Team, Professional, or Enterprise seats on the pricing catalog shown below",
] as const;

export const SECURENOW_BILLING_COMPARISON_SECURENOW_INCLUDES = SECURENOW_BETA_SKU_CONTENTS_INCLUDES.slice(0, 2);

export const SECURENOW_BILLING_COMPARISON_SECURENOW_EXCLUDES = SECURENOW_BETA_SKU_CONTENTS_EXCLUDES.slice(0, 2);

export const SECURENOW_BILLING_COMPARISON_SKU_CARD_HREF = "/securenow-sku" as const;

export const SECURENOW_BILLING_COMPARISON_QUOTE_PACKET_HREF = SECURENOW_OPERATOR_QUOTE_PACKET_HREF;
