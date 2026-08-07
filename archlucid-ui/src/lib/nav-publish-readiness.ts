import type { NavLinkItem } from "@/lib/nav-config";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";

/** Deep-linked routes remain usable; sidebar/palette omit these until mock/API readiness improves. */
const PRE_RELEASE_OPERATOR_HREFS = new Set<string>([
  "/internal/recommendation-learning",
  "/internal/product-learning",
]);

/**
 * When `NEXT_PUBLIC_OPERATOR_NAV_SHOW_PRE_RELEASE_ROUTES=1`, all configured nav links are shown (tests/local full nav).
 * The buyer-polished shell also shows them: buyers expect the full grouped catalog (Recommendation
 * tuning, Pilot feedback) inside collapsed groups; the full operator first-pilot funnel keeps the pre-release gate.
 */
export function filterNavLinksByPublishReadiness(links: ReadonlyArray<NavLinkItem>): NavLinkItem[] {
  const showPreRelease =
    typeof process.env.NEXT_PUBLIC_OPERATOR_NAV_SHOW_PRE_RELEASE_ROUTES === "string" &&
    process.env.NEXT_PUBLIC_OPERATOR_NAV_SHOW_PRE_RELEASE_ROUTES.trim() === "1";

  if (showPreRelease || isBuyerPolishedOperatorShellEnv())
    return [...links];

  return links.filter((link) => !PRE_RELEASE_OPERATOR_HREFS.has(link.href.split("?")[0]));
}
