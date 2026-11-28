import {
  SECURENOW_MARKETABILITY_BUYER_PATH_LEAD,
  SECURENOW_MARKETABILITY_NOT_PUBLIC_OFFER_LINE,
  SECURENOW_MARKETABILITY_QUOTE_PACKET_HREF,
  SECURENOW_MARKETABILITY_QUOTE_PACKET_LABEL,
  SECURENOW_MARKETABILITY_SAMPLE_HREF,
  SECURENOW_MARKETABILITY_SAMPLE_LABEL,
  SECURENOW_MARKETABILITY_SN_EVAL_QUOTE_LINE,
  SECURENOW_MARKETABILITY_WHY_SECURENOW_HREF,
  SECURENOW_MARKETABILITY_WHY_SECURENOW_LABEL,
} from "@/lib/product-line/securenow-marketability-buyer-path-copy";

export type SecureNowMarketabilityBuyerPathLink = {
  readonly href: string;
  readonly label: string;
};

export type SecureNowMarketabilityBuyerPath = {
  readonly lead: string;
  readonly snEvalQuoteLine: string;
  readonly notPublicOfferLine: string;
  readonly links: readonly SecureNowMarketabilityBuyerPathLink[];
};

export function resolveSecureNowMarketabilityBuyerPath(): SecureNowMarketabilityBuyerPath {
  return {
    lead: SECURENOW_MARKETABILITY_BUYER_PATH_LEAD,
    snEvalQuoteLine: SECURENOW_MARKETABILITY_SN_EVAL_QUOTE_LINE,
    notPublicOfferLine: SECURENOW_MARKETABILITY_NOT_PUBLIC_OFFER_LINE,
    links: [
      { href: SECURENOW_MARKETABILITY_WHY_SECURENOW_HREF, label: SECURENOW_MARKETABILITY_WHY_SECURENOW_LABEL },
      { href: SECURENOW_MARKETABILITY_SAMPLE_HREF, label: SECURENOW_MARKETABILITY_SAMPLE_LABEL },
      { href: SECURENOW_MARKETABILITY_QUOTE_PACKET_HREF, label: SECURENOW_MARKETABILITY_QUOTE_PACKET_LABEL },
    ],
  };
}
