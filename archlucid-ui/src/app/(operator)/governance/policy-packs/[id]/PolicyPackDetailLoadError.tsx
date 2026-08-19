import { Button } from "@/components/ui/button";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import {
  POLICY_PACK_DETAIL_LOAD_ERROR_BODY,
  POLICY_PACK_DETAIL_LOAD_ERROR_TITLE,
  POLICY_PACK_DETAIL_RETRY_ACTION,
} from "@/lib/responsible-ai-policy-pack-detail-content";

type PolicyPackDetailLoadErrorProps = {
  readonly onRetry: () => void;
};

export function PolicyPackDetailLoadError(props: PolicyPackDetailLoadErrorProps): React.JSX.Element {
  return (
    <div className="p-4" data-testid="policy-pack-detail-load-error">
      <EnterpriseCompactEmptyState
        testId="policy-pack-load-error-empty-state"
        title={POLICY_PACK_DETAIL_LOAD_ERROR_TITLE}
        description={POLICY_PACK_DETAIL_LOAD_ERROR_BODY}
        role="alert"
        footer={
          <Button type="button" size="sm" variant="primary" onClick={props.onRetry}>
            {POLICY_PACK_DETAIL_RETRY_ACTION}
          </Button>
        }
      />
    </div>
  );
}
