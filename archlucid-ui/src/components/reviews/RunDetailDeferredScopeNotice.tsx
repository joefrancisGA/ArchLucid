import Link from "next/link";

const DEFERRED_ITEMS = [
  {
    id: "soc2-cpa",
    label: "SOC 2 CPA attestation",
    docPath: "/docs/library/V1_DEFERRED.md",
    safeWording: "V1 ships owner-led SOC 2 self-assessment — CPA Type I/II is procurement realism (V1.1 backlog TB-135).",
  },
  {
    id: "third-party-pentest",
    label: "Third-party penetration test",
    docPath: "/docs/library/V1_DEFERRED.md",
    safeWording: "V1 includes owner-conducted pen-test evidence — external vendor attestation is V1.1 backlog TB-136.",
  },
  {
    id: "native-connectors",
    label: "Native Jira / ServiceNow / Slack / Teams",
    docPath: "/docs/library/V1_SCOPE.md",
    safeWording: "V1 offers REST, CLI, and GitHub/Azure DevOps handoff — first-party connectors are V1.1.",
  },
  {
    id: "mcp-marketplace",
    label: "MCP / plugin marketplace GA",
    docPath: "/docs/go-to-market/WHAT_NOT_TO_PROMISE.md",
    safeWording: "MCP and public plugin marketplace are deferred — do not promise GA in V1 pilots.",
  },
  {
    id: "live-commerce",
    label: "Live marketplace checkout",
    docPath: "/docs/go-to-market/WHAT_NOT_TO_PROMISE.md",
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
      className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-800 dark:border-neutral-600 dark:bg-neutral-900/40 dark:text-neutral-100"
      data-testid="run-detail-deferred-scope-notice"
      aria-label="Deferred buyer requirements"
    >
      <p className="m-0 font-semibold">DEFERRED_SCOPE — not V1 defects</p>
      <p className="m-0 mt-1 text-neutral-700 dark:text-neutral-300">
        Recorded buyer requirements below are explicitly out of V1 first-pilot scope. Use safe wording in sponsor
        conversations — they do not block current proof disposition.
      </p>
      <ul className="mb-0 mt-2 list-disc space-y-1 pl-5">
        {DEFERRED_ITEMS.map((item) => (
          <li key={item.id} data-testid={`deferred-scope-item-${item.id}`}>
            <span className="font-medium">{item.label}:</span> {item.safeWording}{" "}
            <Link href={item.docPath} className="underline underline-offset-2">
              Scope doc
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
