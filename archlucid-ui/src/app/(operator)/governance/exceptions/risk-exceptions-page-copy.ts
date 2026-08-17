import { RISK_EXCEPTIONS_PAGE_SUBTITLE } from "@/lib/risk-exceptions-page";

export const RISK_EXCEPTIONS_CLAIM_HEADING = "Waiver register only";

export const RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER =
  "Review active waivers with owners and expiry dates — renew or revoke before they lapse, or open Findings for disposition follow-up.";

export function riskExceptionsPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? RISK_EXCEPTIONS_PAGE_SUBTITLE_BUYER : RISK_EXCEPTIONS_PAGE_SUBTITLE;
}

export const RISK_EXCEPTIONS_LOADING_STATUS = "Loading risk exceptions…";

export const RISK_EXCEPTIONS_LOAD_RETRY_LABEL = "Retry loading exceptions";
