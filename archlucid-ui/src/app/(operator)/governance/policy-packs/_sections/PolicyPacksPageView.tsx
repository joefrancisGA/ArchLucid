"use client";

import { useMemo } from "react";

import { cn } from "@/lib/utils";
import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";
import { PolicyPackImpactPreviewPanel } from "@/components/policy/PolicyPackImpactPreviewPanel";
import { PolicyPackImpactSimulationCard } from "@/components/policy/PolicyPackImpactSimulationCard";
import { PolicyPackBasisStatusBanner } from "@/components/governance/PolicyPackBasisStatusBanner";
import { buildPolicyPackEnforcedRuleRows } from "@/lib/policy/policy-pack-enforced-rules";
import {
  policyPacksPageSubtitle,
} from "@/lib/policy/policy-packs-page";
import {
  policyPacksRefreshAssistReaderLine,
  policyPacksRefreshAssistReaderLineBuyerPolished,
} from "@/lib/enterprise-controls-context-copy";
import { PolicyPacksActivePackSummaryCard } from "./PolicyPacksActivePackSummaryCard";
import { PolicyPacksBuyerChrome } from "./PolicyPacksBuyerChrome";
import { PolicyPacksBreadcrumb } from "./PolicyPacksBreadcrumb";
import { PolicyPacksNextReviewFooterClient } from "./PolicyPacksNextReviewFooterClient";
import { PolicyPacksCatalogSection } from "./PolicyPacksCatalogSection";
import { PolicyPacksEnforcedRulesTable } from "./PolicyPacksEnforcedRulesTable";
import { PolicyPacksInspectSection } from "./PolicyPacksInspectSection";
import { PolicyPacksLifecycleSection } from "./PolicyPacksLifecycleSection";
import { PolicyPacksLoadFailure } from "./PolicyPacksLoadFailure";
import { PolicyPacksLoadingSkeleton } from "./PolicyPacksLoadingSkeleton";
import { PolicyPacksMarketingIntro } from "./PolicyPacksMarketingIntro";
import { PolicyPacksMetricStrip } from "./PolicyPacksMetricStrip";
import { PolicyPacksPageHeader } from "./PolicyPacksPageHeader";
import { PolicyPacksRegisteredListSection } from "./PolicyPacksRegisteredListSection";
import { PolicyPacksContinueLastViewedRow } from "./PolicyPacksContinueLastViewedRow";
import { resolveContinueLastPolicyPack } from "@/lib/resolve-continue-last-policy-pack";
import { PolicyPacksWorkspaceSelectionSection } from "./PolicyPacksWorkspaceSelectionSection";
import { PolicyPacksAdvancedAuthoringPanel } from "./PolicyPacksAdvancedAuthoringPanel";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorRelatedSurfacesDisclosure } from "@/components/operator/OperatorRelatedSurfacesDisclosure";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { PatternLibraryPolicyPacksVocabularyRail } from "@/components/PatternLibraryPolicyPacksVocabularyRail";
import { PolicyPackDetailHubVocabularyRail } from "@/components/policy/PolicyPackDetailHubVocabularyRail";
import { PolicyPacksStandardsVocabularyRail } from "@/components/policy/PolicyPacksStandardsVocabularyRail";
import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/governance/GovernanceSetupConfigHubsVocabularyRail";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import {
  OPERATOR_LAYOUT,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { PolicyPacksPageTab } from "./policy-packs-page-view-model";

type Props = {
  readonly model: PolicyPacksPageViewModel;
};

function resolveAuthoringInnerTab(pageTab: PolicyPacksPageTab): "author" | "generator" {
  if (pageTab === "generator") {
    return "generator";
  }

  return "author";
}

function resolveSurfaceTab(pageTab: PolicyPacksPageTab): "my-packs" | "catalog" {
  if (pageTab === "catalog") {
    return "catalog";
  }

  return "my-packs";
}

function resolveSurfaceTabFromValue(value: string): "my-packs" | "catalog" {
  if (value === "catalog") {
    return "catalog";
  }

  return "my-packs";
}

export function PolicyPacksPageView(props: Props) {
  const m = props.model;
  const surfaceTab = resolveSurfaceTab(m.pageTab);
  const authoringInnerTab = resolveAuthoringInnerTab(m.pageTab);
  const enforcedRuleRows = buildPolicyPackEnforcedRuleRows(m.effectiveContent, m.effective?.packs ?? []);
  const enforcedRuleCount = enforcedRuleRows.length;
  const continueLastPack = useMemo(() => resolveContinueLastPolicyPack(m.packs), [m.packs]);

  return (
    <OperatorPageContainer variant="dashboard" className={OPERATOR_LAYOUT.sectionStack}>
      {m.buyerPolishedShell ? <PolicyPackBasisStatusBanner className="mb-3" /> : null}

      <PolicyPacksPageHeader
        subtitle={policyPacksPageSubtitle(m.buyerPolishedShell)}
        refreshing={m.loading}
        lastRefreshedAt={m.lastRefreshedAt}
        onRefresh={m.load}
        breadcrumb={m.buyerPolishedShell ? <PolicyPacksBreadcrumb /> : undefined}
      />
      {m.buyerPolishedShell ? null : (
        <>
          <LayerHeader
            pageKey="policy-packs"
            density="compact"
            className="mb-3"
          />
          <OperatorRelatedSurfacesDisclosure testId="policy-packs-related-surfaces-disclosure">
            <PolicyPacksStandardsVocabularyRail currentSurfaceId="policy-packs" />
            <PatternLibraryPolicyPacksVocabularyRail currentSurfaceId="policy-packs" />
            <PolicyPackDetailHubVocabularyRail currentSurfaceId="policy-packs" policyPackId={m.selectedPackId} />
            <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="policy-packs" />
          </OperatorRelatedSurfacesDisclosure>
        </>
      )}

      {m.loading && m.buyerPolishedShell ? <PolicyPacksLoadingSkeleton /> : null}

      {m.failure !== null && m.buyerPolishedShell ? (
        <PolicyPacksLoadFailure
          message={m.failure.message}
          retrying={m.loading}
          onRetry={() => {
            void m.load();
          }}
        />
      ) : null}

      {m.publishSuccessMessage !== null ? (
        <OperatorSuccessCallout
          message={m.publishSuccessMessage}
          testId="policy-pack-publish-success-callout"
          className="mb-4"
          onDismiss={() => m.setPublishSuccessMessage(null)}
        />
      ) : null}

      {!m.buyerPolishedShell ? (
        <PolicyPacksMarketingIntro buyerPolishedShell={m.buyerPolishedShell} canMutatePacks={m.canMutatePacks} />
      ) : null}

      {!m.canMutatePacks ? (
        <p
          className={cn("mb-3 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="policy-packs-reader-assist"
        >
          {m.buyerPolishedShell
            ? policyPacksRefreshAssistReaderLineBuyerPolished
            : policyPacksRefreshAssistReaderLine}
        </p>
      ) : null}

      {m.buyerPolishedShell && !m.loading && m.failure === null ? (
        <div className={cn("mb-4 grid gap-4", OPERATOR_LAYOUT.sectionStack)}>
          <PolicyPacksActivePackSummaryCard
            effective={m.effective}
            effectiveContent={m.effectiveContent}
            selectedPack={m.selectedPackSummary}
            enforcedRuleCount={enforcedRuleCount}
            canMutatePacks={m.canMutatePacks}
            onOpenCatalog={() => {
              m.setPageTab("my-packs");
            }}
          />
          <PolicyPacksEnforcedRulesTable rows={enforcedRuleRows} />
        </div>
      ) : (
        <PolicyPacksMetricStrip
          buyerPolishedShell={m.buyerPolishedShell}
          packCount={m.packs.length}
          effective={m.effective}
          selectedPackSummary={m.selectedPackSummary}
        />
      )}

      <Tabs
        value={surfaceTab}
        onValueChange={(next) => {
          m.setPageTab(resolveSurfaceTabFromValue(next));
        }}
        className="mb-6"
      >
        <TabsList aria-label="Policy packs sections" data-testid="policy-packs-surface-tabs">
          <TabsTrigger value="my-packs" data-testid="policy-packs-tab-my-packs" className="shrink-0">
            My packs
          </TabsTrigger>
          <TabsTrigger value="catalog" data-testid="policy-packs-tab-catalog" className="shrink-0">
            Catalog
          </TabsTrigger>
        </TabsList>

        <TabsContent value="catalog" className="pt-4" data-testid="policy-packs-panel-catalog">
          <PolicyPacksCatalogSection
            canMutatePacks={m.canMutatePacks}
            loading={m.catalogLoading || m.loading}
            failure={m.catalogFailure}
            items={m.catalogItems}
            selectedCatalogEntryId={m.selectedCatalogEntryId}
            onSelectedCatalogEntryIdChange={m.setSelectedCatalogEntryId}
            onRefresh={m.refreshCatalog}
            onClone={m.onCloneCatalogEntry}
          />
        </TabsContent>

        <TabsContent value="my-packs" className="pt-4" data-testid="policy-packs-panel-my-packs">
          {m.failure !== null && !m.buyerPolishedShell ? (
            <div role="alert">
              <OperatorApiProblem
                problem={m.failure.problem}
                fallbackMessage={m.failure.message}
                correlationId={m.failure.correlationId}
              />
            </div>
          ) : null}

          {!m.buyerPolishedShell ? (
            <PolicyPackImpactPreviewPanel
              effectiveContent={m.effectiveContent}
              selectedPackId={m.selectedPackId}
              packVersions={m.packVersions}
              scopedReviewId={m.pickedReviewId}
              onPickReview={m.setPickedReviewId}
            />
          ) : null}

          <div className={cn("flex flex-col gap-8", !m.canMutatePacks && "flex-col-reverse")}>
            <PolicyPacksWorkspaceSelectionSection
              canMutatePacks={m.canMutatePacks}
              items={m.workspaceSelectionItems}
              loading={m.workspaceSelectionLoading || m.loading}
              togglingAssignmentId={m.togglingAssignmentId}
              onToggle={(assignmentId, nextEnabled) => {
                void m.onToggleWorkspaceSelection(assignmentId, nextEnabled);
              }}
            />

            {continueLastPack !== null ? (
              <PolicyPacksContinueLastViewedRow pack={continueLastPack} scopedReviewId={m.pickedReviewId} />
            ) : null}

            <PolicyPacksRegisteredListSection
              buyerPolishedShell={m.buyerPolishedShell}
              canMutatePacks={m.canMutatePacks}
              packs={m.packs}
              effectivePackIds={new Set((m.effective?.packs ?? []).map((p) => p.policyPackId))}
              selectedPackId={m.selectedPackId}
              onSelectedPackIdChange={m.setSelectedPackId}
            />

            {!m.buyerPolishedShell ? (
              <div data-testid="policy-packs-advanced-options">
                <AdvancedOptionsAccordion
                  className="mb-8"
                  open={m.authoringAdvancedOpen}
                  onOpenChange={m.setAuthoringAdvancedOpen}
                  triggerLabel="Inspect tools and JSON lifecycle"
                >
                  <PolicyPackImpactSimulationCard
                    selectedPackId={m.selectedPackId}
                    selectedPackLabel={m.selectedPackSummary?.name ?? null}
                  />

                  <PolicyPacksInspectSection
                    canMutatePacks={m.canMutatePacks}
                    selectedPackId={m.selectedPackId}
                    effective={m.effective}
                    effectiveContent={m.effectiveContent}
                    packVersions={m.packVersions}
                    compareLeftId={m.compareLeftId}
                    compareRightId={m.compareRightId}
                    onCompareLeftIdChange={m.setCompareLeftId}
                    onCompareRightIdChange={m.setCompareRightId}
                    showVersionDiff={m.showVersionDiff}
                    setShowVersionDiff={m.setShowVersionDiff}
                    compareLeftVersion={m.compareLeftVersion}
                    compareRightVersion={m.compareRightVersion}
                  />

                  {isStaticDemoPayloadFallbackEnabled() || m.buyerPolishedShell ? null : (
                    <PolicyPacksLifecycleSection
                      canMutatePacks={m.canMutatePacks}
                      loading={m.loading}
                      selectedPackId={m.selectedPackId}
                      verticalImportSlug={m.verticalImportSlug}
                      bundledPublishBlocked={m.bundledPublishBlocked}
                      onImportVertical={m.importVerticalPolicyPack}
                      name={m.name}
                      onNameChange={m.setName}
                      description={m.description}
                      onDescriptionChange={m.setDescription}
                      packType={m.packType}
                      onPackTypeChange={m.setPackType}
                      createJson={m.createJson}
                      onCreateJsonChange={m.setCreateJson}
                      onCreate={m.onCreate}
                      publishVersion={m.publishVersion}
                      onPublishVersionChange={m.setPublishVersion}
                      publishJson={m.publishJson}
                      onPublishJsonChange={m.setPublishJson}
                      onPublish={m.onPublish}
                      assignVersion={m.assignVersion}
                      onAssignVersionChange={m.setAssignVersion}
                      assignScopeLevel={m.assignScopeLevel}
                      onAssignScopeLevelChange={m.setAssignScopeLevel}
                      assignPinned={m.assignPinned}
                      onAssignPinnedChange={m.setAssignPinned}
                      onAssign={m.onAssign}
                      pickedReviewId={m.pickedReviewId}
                      onPickReviewForAssign={m.setPickedReviewId}
                    />
                  )}
                </AdvancedOptionsAccordion>
              </div>
            ) : null}

            {!m.buyerPolishedShell ? (
              <PolicyPacksAdvancedAuthoringPanel
                model={m}
                authoringTab={authoringInnerTab}
                onAuthoringTabChange={m.setPageTab}
              />
            ) : null}
          </div>
        </TabsContent>
      </Tabs>

      {m.pickedReviewId.trim().length > 0 ? (
        <PolicyPacksNextReviewFooterClient runId={m.pickedReviewId.trim()} />
      ) : null}

      {m.buyerPolishedShell ? <PolicyPacksBuyerChrome /> : null}
    </OperatorPageContainer>
  );
}
