import { SECURENOW_QUOTE_PACKET_SEQUENCE } from "@/lib/product-line/securenow-quote-packet-copy";

export const SECURENOW_PUBLIC_QUOTE_SEQUENCE_SECTION_ID = "securenow-public-quote-sequence" as const;

export const SECURENOW_ARCHITECTURE_SUBSCRIPTION_BOUNDARY =
  "An ArchLucid Team, Professional, or Enterprise subscription does not include SecureNow SKU entitlements. SecureNow is quoted separately." as const;

export const SECURENOW_PUBLIC_QUOTE_SEQUENCE_HEADING = "Quote sequence (buyer-safe)" as const;

export const SECURENOW_PUBLIC_QUOTE_SEQUENCE_LEAD =
  "After scope alignment, the owner sends these documents in order. Quote fees are recorded in the pricing philosophy and are not printed on this page. SecureNow beta remains NO_GO." as const;

export const SECURENOW_PUBLIC_QUOTE_SEQUENCE_STEPS = SECURENOW_QUOTE_PACKET_SEQUENCE;

export const SECURENOW_SKU_METER_CAP_COLUMN = "At the meter cap" as const;

export type SecureNowSkuMeterCapCopy = {
  readonly sku: string;
  readonly atMeterCap: string;
};

export const SECURENOW_SKU_METER_CAP_COPY: readonly SecureNowSkuMeterCapCopy[] = [
  {
    sku: "SN-EVAL",
    atMeterCap:
      "Additional successful snapshots pause until the owner extends scope or moves to an annual term; the 45-day window does not reset automatically.",
  },
  {
    sku: "SN-ANNUAL",
    atMeterCap:
      "Extra subscriptions or snapshots require SN-SUB-ADD or SN-SNAP-4 through a private quote; unused snapshot balance does not roll past the annual term end.",
  },
  {
    sku: "SN-SUB-ADD",
    atMeterCap:
      "Applies only while an annual term is active; it adds one subscription slot and does not raise operator or snapshot caps by itself.",
  },
  {
    sku: "SN-SNAP-4",
    atMeterCap:
      "Unused snapshot balance expires at the applicable annual term end; it does not renew automatically.",
  },
] as const;

export function secureNowSkuMeterCapForSku(sku: string): string | null {
  const trimmed = sku.trim();
  const row = SECURENOW_SKU_METER_CAP_COPY.find((entry) => entry.sku === trimmed);

  return row?.atMeterCap ?? null;
}
