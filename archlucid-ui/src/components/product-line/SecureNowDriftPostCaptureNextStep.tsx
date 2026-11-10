"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { useSecureNowCollectionSetupInput } from "@/hooks/use-securenow-collection-setup-input";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isSecureNowCollectionSetupComplete } from "@/lib/product-line/format-securenow-collection-setup-progress";
import {
  resolveSecureNowPostDriftNextHref,
  resolveSecureNowPostDriftNextLinkLabel,
  SECURENOW_DRIFT_POST_CAPTURE_NEXT_SUMMARY,
} from "@/lib/product-line/securenow-home-next-step";
import { fetchRankedSecurityEvidencePaths } from "@/lib/security-evidence-path-api";
import { cn } from "@/lib/utils";

export type SecureNowDriftPostCaptureNextStepProps = {
  readonly selectedSnapshotId: string;
};

/** SecureNow drift — after a capture is in focus, name Path inspect as the next step. */
export function SecureNowDriftPostCaptureNextStep(
  props: SecureNowDriftPostCaptureNextStepProps,
): React.JSX.Element | null {
  const { productLine } = useProductLine();
  const scope = useOperatorScopeQueryKey();
  const setupQuery = useSecureNowCollectionSetupInput({ snapshotCaptureSucceeded: null });
  const rankedPathsQuery = useQuery({
    queryKey: ["securenow", "drift", "ranked-paths", scope.workspaceId, scope.projectId],
    queryFn: () => fetchRankedSecurityEvidencePaths(1, 1),
    retry: false,
    enabled: productLine === "security",
  });
  const snapshotId = props.selectedSnapshotId.trim();

  if (productLine !== "security" || snapshotId.length === 0) {
    return null;
  }

  if (setupQuery.isPending || setupQuery.collectionInput === null) {
    return null;
  }

  if (!isSecureNowCollectionSetupComplete(setupQuery.collectionInput)) {
    return null;
  }

  const firstRankedPathId = rankedPathsQuery.data?.items[0]?.pathId ?? null;

  return (
    <p
      className={cn("m-0", OPERATOR_TYPOGRAPHY.helper)}
      data-testid="securenow-drift-post-capture-next-step"
    >
      {SECURENOW_DRIFT_POST_CAPTURE_NEXT_SUMMARY}{" "}
      {rankedPathsQuery.isPending ? (
        <span>Loading next step…</span>
      ) : (
        <Link
          className={OPERATOR_LINK.inline}
          href={resolveSecureNowPostDriftNextHref(firstRankedPathId)}
          data-testid="securenow-drift-post-capture-next-link"
        >
          {resolveSecureNowPostDriftNextLinkLabel(firstRankedPathId)}
        </Link>
      )}
    </p>
  );
}
