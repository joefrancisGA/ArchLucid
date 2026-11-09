import { SecureNowHomeDestinationSection } from "@/components/product-line/SecureNowHomeDestinationSection";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  SECURENOW_ACCELERATOR_INDEX_GUARDRAIL,
  SECURENOW_ACCELERATOR_INDEX_HEADING,
  SECURENOW_ACCELERATOR_INDEX_LEAD,
  SECURENOW_ACCELERATOR_INDEX_ROWS,
} from "@/lib/product-line/securenow-accelerator-index-copy";

export function SecureNowAcceleratorIndexPageView(): React.JSX.Element {
  return (
    <OperatorPageContainer variant="full" data-testid="securenow-accelerator-index-page">
      <OperatorPageHeader title={SECURENOW_ACCELERATOR_INDEX_HEADING} subtitle={SECURENOW_ACCELERATOR_INDEX_LEAD} />

      <main className="mt-6 max-w-3xl space-y-6">
        <p className={OPERATOR_TYPOGRAPHY.body}>{SECURENOW_ACCELERATOR_INDEX_GUARDRAIL}</p>
        <SecureNowHomeDestinationSection
          heading="Accelerators"
          lead="Each row is synthetic until capture produces stored paths."
          rows={SECURENOW_ACCELERATOR_INDEX_ROWS}
          sectionTestId="securenow-accelerator-index-table"
          headingId="securenow-accelerator-index-heading"
          tableAriaLabel="SecureNow accelerator destinations"
          linkTestIdPrefix="securenow-accelerator-index-link"
        />
      </main>
    </OperatorPageContainer>
  );
}
