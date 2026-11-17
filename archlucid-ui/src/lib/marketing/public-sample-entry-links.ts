import { SECURENOW_SAMPLE_FIXTURE_PATH_ID } from "@/lib/marketing/securenow-sample-copy";
import { SECURENOW_SAMPLE_MARKETING_PATH } from "@/lib/product-line/securenow-marketing-route-policy";
import { CUSTOMER_INTAKE_CANONICAL_PROOF_HREF } from "@/lib/samples/customer-intake-modernization/definition";

/**
 * Owner decision 2026-11-02: the existing sample review and fixture-path-01
 * may appear on the welcome page and the marketing footer.
 * `/why-securenow` stays off those two surfaces. M-316 quote documents stay off them too.
 */
export const PUBLIC_SAMPLE_REVIEW_HREF = CUSTOMER_INTAKE_CANONICAL_PROOF_HREF;

export const PUBLIC_SAMPLE_REVIEW_LABEL = "Healthcare Claims sample review" as const;

export const PUBLIC_SECURENOW_FIXTURE_SAMPLE_HREF = SECURENOW_SAMPLE_MARKETING_PATH;

export const PUBLIC_SECURENOW_FIXTURE_SAMPLE_LABEL =
  `SecureNow sample (${SECURENOW_SAMPLE_FIXTURE_PATH_ID})` as const;

export const PUBLIC_SECURENOW_SKU_CARD_HREF = "/securenow-sku" as const;

export const PUBLIC_SECURENOW_SKU_CARD_LABEL = "SecureNow SKU and meter card" as const;
