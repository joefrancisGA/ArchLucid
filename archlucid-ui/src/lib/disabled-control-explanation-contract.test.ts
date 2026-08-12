import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";

import { describe, expect, it } from "vitest";

const SRC_ROOT = join(process.cwd(), "src");

/**
 * Components where a disabled Button still explains itself through `title` (TB-2378 ratchet).
 *
 * A `title` tooltip is the wrong carrier for this: disabled buttons are not focusable, so keyboard
 * users never reach the tooltip, and it never appears on touch. The explanation belongs in a
 * visible `WhyDisabledCtaHint` (or adjacent helper text wired up with `aria-describedby`).
 * This list may shrink but must never grow.
 */
const TITLE_ONLY_DISABLED_EXPLANATION_BASELINE: ReadonlySet<string> = new Set([
  "app/(operator)/administration/tenant/_sections/TenantWorkspaceProjectsCard.tsx",
  "app/(operator)/administration/tenant/recycle-bin/_sections/ProjectsRecycleBinPage.tsx",
  "app/(operator)/architecture/reviews/[runId]/findings/[findingId]/FindingInspectGovernanceStickinessPanel.tsx",
  "app/(operator)/governance/_sections/GovernanceWorkflowPromotionsActivationsSection.tsx",
  "app/(operator)/governance/policy-packs/_sections/PolicyRulePlainEnglishDraftPanel.tsx",
  "app/(operator)/governance/standards-and-rules/_sections/GovernanceResolutionPageView.tsx",
  "app/(operator)/help/_sections/HelpSpecialtyWalkthroughTemplatesClient.tsx",
  "app/(operator)/insights/executive-summary/_sections/ValueReportPageView.tsx",
  "app/(operator)/integrations/cloud-connections/_sections/Tier2ConnectionWizard.tsx",
  "app/(operator)/internal/integration-events/dlq/_sections/IntegrationEventsDlqPageClient.tsx",
  "components/GraphBuyerCanvasToolbar.tsx",
  "components/ShareReviewPackageButton.tsx",
  "components/alerts/AlertsInboxControls.tsx",
  "components/alerts/AlertsInboxDialogs.tsx",
  "components/alerts/AlertsInboxPagination.tsx",
  "components/findings/FindingFeedbackThumbs.tsx",
  "components/governance/GovernanceQuickApproveButton.tsx",
  "components/runs/RunDetailRunGovernanceDispositionActions.tsx",
]);

const OPENING_BUTTON_TAG = /<Button\b[^>]*>/g;

function collectComponentFiles(directory: string): string[] {
  const collected: string[] = [];

  for (const entry of readdirSync(directory)) {
    const absolute = join(directory, entry);

    if (statSync(absolute).isDirectory()) {
      collected.push(...collectComponentFiles(absolute));
      continue;
    }

    if (extname(absolute) === ".tsx" && !absolute.includes(".test.")) {
      collected.push(absolute);
    }
  }

  return collected;
}

function toPosixRelativePath(absolute: string): string {
  return relative(SRC_ROOT, absolute).split("\\").join("/");
}

function hasTitleOnDisabledButton(absolute: string): boolean {
  const source = readFileSync(absolute, "utf8");

  return (source.match(OPENING_BUTTON_TAG) ?? []).some(
    (tag) => /\bdisabled\b/.test(tag) && /\btitle=/.test(tag),
  );
}

describe("disabled control explanations (TB-2378)", () => {
  it("keeps title-carried disabled explanations inside the frozen baseline", () => {
    const offenders = collectComponentFiles(SRC_ROOT)
      .filter(hasTitleOnDisabledButton)
      .map(toPosixRelativePath)
      .filter((path) => !TITLE_ONLY_DISABLED_EXPLANATION_BASELINE.has(path))
      .sort();

    expect(offenders).toEqual([]);
  });

  it("does not carry baseline entries that were already migrated", () => {
    const stale = [...TITLE_ONLY_DISABLED_EXPLANATION_BASELINE]
      .filter((path) => !hasTitleOnDisabledButton(join(SRC_ROOT, path)))
      .sort();

    expect(stale).toEqual([]);
  });
});
