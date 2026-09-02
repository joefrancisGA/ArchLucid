"use client";

import { IntegrationEventsDlqBulkRetryConfirmDialog, IntegrationEventsDlqSuppressConfirmDialog } from "@/app/(operator)/internal/failed-integration-messages/_sections/IntegrationEventsDlqConfirmDialogs";
import { IntegrationEventsDlqQueueCardSection } from "@/app/(operator)/internal/failed-integration-messages/_sections/IntegrationEventsDlqQueueCardSection";
import { useIntegrationEventsDlqLoader } from "@/app/(operator)/internal/failed-integration-messages/_sections/useIntegrationEventsDlqLoader";
import { useIntegrationEventsDlqMutations } from "@/app/(operator)/internal/failed-integration-messages/_sections/useIntegrationEventsDlqMutations";
import { IntegrationEventsDlqEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { WebhooksVsDlqVocabularyRail } from "@/components/WebhooksVsDlqVocabularyRail";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { INTERNAL_INTEGRATION_EVENTS_DLQ_PATH } from "@/lib/internal-ops-route-paths";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { DESIGN_TOKENS, OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { INTEGRATION_EVENTS_DLQ_PAGE_SUBTITLE, INTEGRATION_EVENTS_DLQ_PAGE_TITLE } from "@/lib/integration-events-dlq-page-copy";
import { cn } from "@/lib/utils";

export function IntegrationEventsDlqPageClient() {
  const canMutate = useNavCallerAuthorityRank() >= AUTHORITY_RANK.AdminAuthority;
  const mutationDisabledHintId = "integration-events-dlq-mutate-disabled-hint";
  const mutationDisabledReason = canMutate ? null : whyDisabledEnterpriseMutationControl();
  const loader = useIntegrationEventsDlqLoader();
  const mutations = useIntegrationEventsDlqMutations({ canMutate, reload: loader.load });
  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack} data-testid="integration-events-dlq-page">
      <OperatorPageHeader navHref={INTERNAL_INTEGRATION_EVENTS_DLQ_PATH} title={INTEGRATION_EVENTS_DLQ_PAGE_TITLE} titleTestId="integration-events-dlq-page-title" headingLevel="h1" subtitle={INTEGRATION_EVENTS_DLQ_PAGE_SUBTITLE} actions={<PageContextualHelpButton />}>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Internal Operations staff may also see these rows described as dead letters in API or runbook vocabulary.</p>
        <WebhooksVsDlqVocabularyRail currentSurfaceId="dlq" />
        {!canMutate ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Administrator access required to retry or suppress failed integration messages.</p> : null}
      </OperatorPageHeader>
      <IntegrationEventsDlqEvidenceOrientationStrip />
      <div className={cn(DESIGN_TOKENS.callout.warn, "px-4 py-3")} role="status" data-testid="integration-events-dlq-cross-tenant-callout">
        <p className="m-0 font-semibold">Cross-tenant Internal Operations queue</p>
        <p className="m-0 mt-1">Failed messages span all tenants and event types — not your current workspace only. Fix the root cause before bulk retry.</p>
      </div>
      <IntegrationEventsDlqQueueCardSection state={loader.state} onRefresh={() => void loader.load()} canMutate={canMutate} mutationDisabledHintId={mutationDisabledHintId} mutationDisabledReason={mutationDisabledReason} bulkRetrying={mutations.bulkRetrying} onOpenBulkRetryDialog={() => { mutations.setBulkRetryAcknowledgment(""); mutations.setBulkRetryDialogOpen(true); }} eventTypeFilter={loader.eventTypeFilter} onEventTypeFilterChange={loader.setEventTypeFilter} tenantFilter={loader.tenantFilter} onTenantFilterChange={loader.setTenantFilter} eventTypeOptions={loader.eventTypeOptions} onClearFilters={loader.clearFilters} filteredRows={loader.filteredRows} retryingId={mutations.retryingId} suppressingId={mutations.suppressingId} onRetry={(id) => void mutations.retry(id)} onSuppressRequest={mutations.setSuppressTargetId} onCopyCurl={(id) => void mutations.copyCurl(id)} />
      <IntegrationEventsDlqBulkRetryConfirmDialog open={mutations.bulkRetryDialogOpen} busy={mutations.bulkRetrying} filteredRowCount={loader.filteredRows.length} acknowledgment={mutations.bulkRetryAcknowledgment} onAcknowledgmentChange={mutations.setBulkRetryAcknowledgment} onCancel={() => { if (!mutations.bulkRetrying) { mutations.setBulkRetryDialogOpen(false); mutations.setBulkRetryAcknowledgment(""); } }} onConfirm={() => void mutations.bulkRetry()} />
      <IntegrationEventsDlqSuppressConfirmDialog open={mutations.suppressTargetId !== null} busy={mutations.suppressingId !== null} onCancel={() => { if (mutations.suppressingId === null) mutations.setSuppressTargetId(null); }} onConfirm={() => { if (mutations.suppressTargetId !== null) void mutations.suppress(mutations.suppressTargetId); }} />
    </OperatorPageContainer>
  );
}
