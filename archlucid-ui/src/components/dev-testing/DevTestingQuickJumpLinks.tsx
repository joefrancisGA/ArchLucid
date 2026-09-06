import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildDevTestingQuickJumpAriaLabel, truncateDevTestingEntityId } from "@/lib/dev-testing-quick-jump-display";
import {
  devTestingApprovalLineagePath,
  devTestingManifestArtifactPath,
  devTestingManifestDetailPath,
  devTestingPlanDetailPath,
  devTestingRunDetailPath,
} from "@/lib/dev-testing-quick-jump-paths";
import type { DevTestingQuickJumpSnapshot } from "@/lib/load-dev-testing-quick-jump-snapshot";
import { cn } from "@/lib/utils";

type DevTestingQuickJumpClusterProps = {
  readonly label: string;
  readonly emptyMessage: string;
  readonly loading: boolean;
  readonly items: readonly { readonly href: string; readonly id: string; readonly entityLabel: string }[];
  readonly testIdPrefix: string;
};

function DevTestingQuickJumpCluster(props: DevTestingQuickJumpClusterProps): React.JSX.Element {
  const { label, emptyMessage, loading, items, testIdPrefix } = props;

  return (
    <div className="flex flex-col gap-2">
      <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
        {label}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {loading ? (
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
            Loading…
          </p>
        ) : null}
        {!loading && items.length === 0 ? (
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)} role="status">
            {emptyMessage}
          </p>
        ) : null}
        {!loading
          ? items.map((item) => (
              <Link
                key={`${testIdPrefix}-${item.id}`}
                href={item.href}
                data-testid={`${testIdPrefix}-${item.id}`}
                className={buttonVariants({ variant: "outline", size: "sm" })}
                aria-label={buildDevTestingQuickJumpAriaLabel(item.entityLabel, item.id)}
              >
                {truncateDevTestingEntityId(item.id)}
              </Link>
            ))
          : null}
      </div>
    </div>
  );
}

type DevTestingQuickJumpLinksProps = {
  readonly snapshot: DevTestingQuickJumpSnapshot;
  readonly loading: boolean;
};

/** Dev-only navigation chips grouped by entity type for the home quick-switch panel. */
export function DevTestingQuickJumpLinks(props: DevTestingQuickJumpLinksProps): React.JSX.Element {
  const { snapshot, loading } = props;

  const planItems = snapshot.plans.map((plan) => ({
    href: devTestingPlanDetailPath(plan.planId),
    id: plan.planId,
    entityLabel: "Improvement plan",
  }));
  const runItems = snapshot.runs.map((run) => ({
    href: devTestingRunDetailPath(run.runId),
    id: run.runId,
    entityLabel: "Architecture review",
  }));
  const approvalItems = snapshot.approvalRequests.map((approval) => ({
    href: devTestingApprovalLineagePath(approval.approvalRequestId),
    id: approval.approvalRequestId,
    entityLabel: "Governance approval",
  }));
  const manifestItems = snapshot.manifests.map((manifest) => ({
    href: devTestingManifestDetailPath(manifest.manifestId),
    id: manifest.manifestId,
    entityLabel: "Sealed review record",
  }));
  const artifactItems = snapshot.artifacts.map((artifact) => ({
    href: devTestingManifestArtifactPath(artifact.manifestId, artifact.artifactId),
    id: artifact.artifactId,
    entityLabel: "Evidence artifact",
  }));

  return (
    <div className="flex flex-col gap-3" data-testid="dev-testing-quick-jump-links">
      <div>
        <p className={cn("m-0 font-medium text-neutral-700 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper)}>
          Quick-jump architecture package IDs
        </p>
        <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Jump directly into current workspace demo data by id.
        </p>
      </div>

      <DevTestingQuickJumpCluster
        label="Improvement plans"
        emptyMessage="No improvement plans yet"
        loading={loading}
        items={planItems}
        testIdPrefix="dev-quick-jump-plan"
      />
      <DevTestingQuickJumpCluster
        label="Architecture reviews"
        emptyMessage="No architecture reviews in this workspace yet"
        loading={loading}
        items={runItems}
        testIdPrefix="dev-quick-jump-run"
      />
      <DevTestingQuickJumpCluster
        label="Governance approvals"
        emptyMessage="No governance approvals for recent reviews"
        loading={loading}
        items={approvalItems}
        testIdPrefix="dev-quick-jump-approval"
      />
      <DevTestingQuickJumpCluster
        label="Sealed review records"
        emptyMessage="No sealed review records linked to recent reviews"
        loading={loading}
        items={manifestItems}
        testIdPrefix="dev-quick-jump-manifest"
      />
      <DevTestingQuickJumpCluster
        label="Evidence artifacts"
        emptyMessage="No evidence artifacts for linked sealed review records"
        loading={loading}
        items={artifactItems}
        testIdPrefix="dev-quick-jump-artifact"
      />
    </div>
  );
}
