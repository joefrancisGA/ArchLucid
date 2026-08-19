import { cn } from "@/lib/utils";
import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

const DEFERRED_ITEMS = [
  {
    id: "soc2-cpa",
    label: "SOC 2 CPA attestation",
    helpHref: inAppHelpHref("soc2-self-assessment"),
    safeWording:
      "ArchLucid ships owner-led SOC 2 self-assessment — CPA Type I/II remains a procurement realism topic.",
  },
  {
    id: "third-party-pentest",
    label: "Third-party penetration test",
    helpHref: inAppHelpHref("security-trust"),
    safeWording:
      "ArchLucid includes owner-conducted pen-test evidence — external vendor attestation follows a funded program.",
  },
  {
    id: "native-connectors",
    label: "Native Jira / ServiceNow / Slack / Teams",
    helpHref: inAppHelpHref("integration-readiness"),
    safeWording:
      "ArchLucid offers REST, CLI, and GitHub/Azure DevOps handoff — additional first-party connectors ship on a separate roadmap.",
  },
  {
    id: "mcp-marketplace",
    label: "MCP / plugin marketplace GA",
    helpHref: inAppHelpHref("procurement"),
    safeWording: "MCP and public plugin marketplace are deferred — do not promise GA in pilots.",
  },
  {
    id: "live-commerce",
    label: "Live marketplace checkout",
    helpHref: inAppHelpHref("procurement"),
    safeWording: "Self-serve commerce and live Marketplace checkout remain deferred — use quote/order-form motion.",
  },
] as const;

type RunDetailDeferredScopeNoticeProps = {
  readonly deferredBuyerRequirementsPresent?: boolean;
};

/** Compact DEFERRED_SCOPE guidance for review detail (Improvement #20). */
export function RunDetailDeferredScopeNotice(
  props: RunDetailDeferredScopeNoticeProps,
): React.JSX.Element | null {
  if (props.deferredBuyerRequirementsPresent !== true) {
    return null;
  }

  return (
    <aside
      className={cn(
        "rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="run-detail-deferred-scope-notice"
      aria-label="Deferred buyer requirements"
    >
      <p className="m-0 font-semibold">Deferred buyer requirements</p>
      <p className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">
        Recorded buyer requirements below are explicitly out of current first-pilot scope. Use safe wording in sponsor
        conversations — they do not block current proof disposition.
      </p>
      <ul className="mb-0 mt-2 list-disc space-y-1 pl-5">
        {DEFERRED_ITEMS.map((item) => (
          <li key={item.id} data-testid={`deferred-scope-item-${item.id}`}>
            <span className="font-medium">{item.label}:</span> {item.safeWording}{" "}
            <Link href={item.helpHref} className={OPERATOR_LINK.nav}>
              Help topic
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
