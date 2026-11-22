"use client";

import { Button } from "@/components/ui/button";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { POLICY_PACK_DETAIL_LOAD_FAILURE_PARTIAL_CAPTURE_LINE } from "@/lib/policy/policy-pack-detail-load-failure-partial-capture-copy";
import {
  POLICY_PACK_DETAIL_LOAD_ERROR_BODY,
  POLICY_PACK_DETAIL_LOAD_ERROR_TITLE,
  POLICY_PACK_DETAIL_RETRY_ACTION,
} from "@/lib/responsible-ai-policy-pack-detail-content";
import { cn } from "@/lib/utils";

type PolicyPackDetailLoadErrorProps = {
  readonly onRetry: () => void;
};

export function PolicyPackDetailLoadError(props: PolicyPackDetailLoadErrorProps): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <div className="space-y-3 p-4" data-testid="policy-pack-detail-load-error">
      <EnterpriseCompactEmptyState
        testId="policy-pack-load-error-empty-state"
        title={POLICY_PACK_DETAIL_LOAD_ERROR_TITLE}
        description={POLICY_PACK_DETAIL_LOAD_ERROR_BODY}
        role="alert"
        footer={
          <div className="space-y-2">
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)} data-testid="policy-pack-detail-load-failure-partial-capture">
              {POLICY_PACK_DETAIL_LOAD_FAILURE_PARTIAL_CAPTURE_LINE}
            </p>
            <FatalPageReportProblemSupportRow
              surfaceId={
                productLine === "security"
                  ? "compliance-policy-pack-detail-hard-failure"
                  : "governance-policy-pack-detail-hard-failure"
              }
              errorTitle="Policy pack detail"
              errorCode="policy-pack-detail-load-failed"
              correlationId={null}
              httpStatus={null}
            />
            <Button type="button" size="sm" variant="primary" onClick={props.onRetry}>
              {POLICY_PACK_DETAIL_RETRY_ACTION}
            </Button>
          </div>
        }
      />
    </div>
  );
}
