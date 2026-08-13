import { BUYER_SPONSOR_OPERATOR_HANDOFF_LINK, BUYER_SPONSOR_SCORECARD_RECOMMENDED_ACTION_LINK } from "@/lib/buyer/buyer-polish-copy";

/** True when a link leaves the sponsor shell for operator-only destinations. */
export function isOperatorShellHandoffHref(href: string): boolean {
  const path = (href.split("?")[0] ?? "").trim();

  if (path.length === 0) {
    return false;
  }

  if (path.startsWith("/sponsor")) {
    return false;
  }

  if (path.startsWith("/auth") || path.startsWith("/help")) {
    return false;
  }

  return true;
}

export type SponsorShellHandoffLinkLabelOptions = {
  readonly buyerPolished?: boolean;
};

/** Link copy for sponsor-surface CTAs that may cross into the operator shell. */
export function executiveShellHandoffLinkLabel(
  href: string,
  options?: SponsorShellHandoffLinkLabelOptions,
): string {
  if (!isOperatorShellHandoffHref(href)) {
    if (options?.buyerPolished === true) {
      return BUYER_SPONSOR_SCORECARD_RECOMMENDED_ACTION_LINK;
    }

    return "View →";
  }

  if (options?.buyerPolished === true) {
    return BUYER_SPONSOR_OPERATOR_HANDOFF_LINK;
  }

  return "Open in Operator →";
}
