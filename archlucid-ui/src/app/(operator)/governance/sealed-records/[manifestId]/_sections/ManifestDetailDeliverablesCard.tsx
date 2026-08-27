import { cn } from "@/lib/utils";

import { ArtifactListTable } from "@/components/ArtifactListTable";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorMalformedCallout } from "@/components/operator/OperatorShellMessage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BUYER_MANIFEST_DOWNLOAD_PREPARING,
  BUYER_MANIFEST_NO_DELIVERABLES_YET,
} from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_DISCLOSURE_TRIGGER_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import { getBundleDownloadUrl } from "@/lib/api";
import type { ArtifactDescriptor } from "@/types/authority";
import type { ManifestDetailPageSuccessModel } from "./manifest-detail-page-model";

type ManifestDetailDeliverablesCardProps = {
  readonly manifestId: string;
  readonly buyerPolishedLayout: boolean;
  readonly artifacts: ArtifactDescriptor[];
  readonly artifactsFailure: ManifestDetailPageSuccessModel["artifactsFailure"];
  readonly artifactsMalformed: ManifestDetailPageSuccessModel["artifactsMalformed"];
};

export function ManifestDetailDeliverablesCard(props: ManifestDetailDeliverablesCardProps): React.JSX.Element {
  const { manifestId, buyerPolishedLayout, artifacts, artifactsFailure, artifactsMalformed } = props;

  return (
    <Card
      id={buyerPolishedLayout ? "manifest-deliverables" : undefined}
      className={buyerPolishedLayout ? "scroll-mt-24" : undefined}
    >
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1 space-y-1.5">
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>
            {buyerPolishedLayout ? "Deliverables" : "Generated artifacts"}
          </CardTitle>
          <CardDescription>
            {buyerPolishedLayout
              ? "These deliverables package the sponsor decision, architecture review board record, and audit evidence for sign-off and diligence. Rows below list individual deliverable artifacts — prefer the consolidated package download when your workspace publishes a full bundle."
              : "Outputs produced during this review — available for preview and download."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!buyerPolishedLayout ? (
          <div>
            <Button variant="outline" size="sm" asChild>
              <a href={getBundleDownloadUrl(manifestId)}>Download bundle (ZIP)</a>
            </Button>
          </div>
        ) : null}

        {artifactsFailure && (
          <>
            <p className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
              {buyerPolishedLayout ? "Deliverables list could not be loaded." : "Artifact list could not be loaded."}
            </p>
            <OperatorApiProblem
              problem={artifactsFailure.problem}
              fallbackMessage={artifactsFailure.message}
              correlationId={artifactsFailure.correlationId}
              variant="warning"
            />
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {buyerPolishedLayout ? (
                <>
                  Try reloading, or return to the review. You can still use Download finalized review when the
                  bundle is available.
                </>
              ) : (
                <>
                  Try reloading, or return to the review detail page. You can still use Download bundle (ZIP) if the list
                  endpoint is unavailable.
                </>
              )}
            </p>
          </>
        )}

        {!artifactsFailure && artifactsMalformed && (
          <>
            <OperatorMalformedCallout>
              <strong>
                {buyerPolishedLayout
                  ? "Deliverables response was not usable."
                  : "Artifact list response was not usable."}
              </strong>
              <p className="mt-2">{artifactsMalformed}</p>
            </OperatorMalformedCallout>
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {buyerPolishedLayout
                ? "Try reloading, or return to the review. ZIP download may still work."
                : "Try reloading, or return to the review detail page. Bundle download may still work."}
            </p>
          </>
        )}

        {!artifactsFailure && !artifactsMalformed && artifacts.length === 0 && (
          <EnterpriseCompactEmptyState
            {...MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT}
            title={buyerPolishedLayout ? BUYER_MANIFEST_NO_DELIVERABLES_YET : MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT.title}
            description={
              buyerPolishedLayout ? (
                <p className="m-0">{BUYER_MANIFEST_DOWNLOAD_PREPARING}</p>
              ) : (
                <>
                  <p className="m-0">{MANIFEST_ARTIFACTS_LIST_EMPTY_COMPACT.description}</p>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    This is a <strong>valid empty result</strong> (HTTP 200 with an empty list), not a failed artifact-list
                    request. <strong>Bundle ZIP may return 404</strong> when no packaged bundle exists yet.
                  </p>
                </>
              )
            }
          />
        )}

        {!artifactsFailure && !artifactsMalformed && artifacts.length > 0 && buyerPolishedLayout ? (
          <details className="group rounded-md border border-neutral-200/90 bg-neutral-50/40 p-3 dark:border-neutral-800 dark:bg-neutral-950/30">
            <summary
              className={cn(
                "cursor-pointer select-none text-al-text-primary outline-none marker:text-al-text-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
                OPERATOR_DISCLOSURE_TRIGGER_CLASS,
              )}
            >
              Show deliverable artifacts ({artifacts.length})
            </summary>
            <div className="mt-4">
              <ArtifactListTable
                manifestId={manifestId}
                artifacts={artifacts}
                sponsorMode={buyerPolishedLayout}
                audienceSections={buyerPolishedLayout}
              />
            </div>
          </details>
        ) : null}
        {!artifactsFailure && !artifactsMalformed && artifacts.length > 0 && !buyerPolishedLayout ? (
          <ArtifactListTable
            manifestId={manifestId}
            artifacts={artifacts}
            sponsorMode={buyerPolishedLayout}
            audienceSections={buyerPolishedLayout}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
