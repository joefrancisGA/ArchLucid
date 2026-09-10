import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatResourceHubTabCompactLabel, formatResourceHubTabViewLabel } from "@/lib/infra-evidence/infra-evidence-hub-tab-labels";
import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";
import { buildResourceHubWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-workbench-url";
import type { mergeWorkbenchHubScopePatch } from "@/lib/infra-evidence/infra-evidence-workbench-hub-scope";
import { cn } from "@/lib/utils";

export type WorkbenchHubScopeExtraLink = {
  readonly testId: string;
  readonly href: string;
  readonly label: string;
};

type WorkbenchHubScopePatch = ReturnType<typeof mergeWorkbenchHubScopePatch>;

type WorkbenchHubScopeLinksProps = {
  readonly cloudResourceId: string;
  readonly primaryTab: ResourceHubTab;
  readonly primaryHref: string;
  readonly primaryTestId: string;
  readonly siblingTestIdPrefix: string;
  readonly scopePatch: WorkbenchHubScopePatch;
  readonly siblingTabs: readonly ResourceHubTab[];
  readonly includeAuditTab?: boolean;
  readonly extraLinks?: readonly WorkbenchHubScopeExtraLink[];
};

function buildSiblingHubHref(
  cloudResourceId: string,
  tab: ResourceHubTab,
  scopePatch: WorkbenchHubScopePatch,
): string {
  return buildResourceHubWorkbenchHref({
    cloudResourceId,
    tab,
    ...scopePatch,
  });
}

function resolveSiblingTestId(prefix: string, tab: ResourceHubTab): string {
  switch (tab) {
    case "terraform":
      return `${prefix}-open-terraform-hub`;
    case "findings":
      return `${prefix}-open-findings-hub`;
    case "remediation":
      return `${prefix}-open-remediation-hub`;
    case "drift":
      return `${prefix}-open-drift-hub`;
    case "diagram":
      return `${prefix}-open-diagram-hub`;
    case "audit":
      return `${prefix}-open-audit-hub`;
    case "overview":
      return `${prefix}-open-overview-hub`;
    default:
      return `${prefix}-open-${tab}-hub`;
  }
}

export function WorkbenchHubScopeLinks(props: WorkbenchHubScopeLinksProps): React.JSX.Element {
  const {
    cloudResourceId,
    primaryTab,
    primaryHref,
    primaryTestId,
    siblingTestIdPrefix,
    scopePatch,
    siblingTabs,
    includeAuditTab = false,
    extraLinks = [],
  } = props;

  const siblingTabEntries: ResourceHubTab[] = [
    ...siblingTabs,
    ...(includeAuditTab ? (["audit"] as const) : []),
  ];

  return (
    <div className="mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Link
          className="text-sm text-al-link hover:underline"
          href={primaryHref}
          data-testid={primaryTestId}
        >
          {formatResourceHubTabViewLabel(primaryTab)}
        </Link>
        {extraLinks.map((link) => (
          <Link
            key={link.testId}
            className="text-sm text-al-link hover:underline"
            href={link.href}
            data-testid={link.testId}
          >
            {link.label}
          </Link>
        ))}
      </div>
      {siblingTabEntries.length > 0 ? (
        <nav aria-label="Related resource hub sections" data-testid="infra-workbench-hub-sibling-nav">
          <p className={cn("m-0 text-sm text-muted-foreground", OPERATOR_TYPOGRAPHY.helper)}>
            Also in hub:{" "}
            {siblingTabEntries.map((tab, index) => (
              <span key={tab}>
                {index > 0 ? " · " : null}
                <Link
                  className="text-al-link hover:underline"
                  href={buildSiblingHubHref(cloudResourceId, tab, scopePatch)}
                  data-testid={resolveSiblingTestId(siblingTestIdPrefix, tab)}
                >
                  {formatResourceHubTabCompactLabel(tab)}
                </Link>
              </span>
            ))}
          </p>
        </nav>
      ) : null}
    </div>
  );
}
