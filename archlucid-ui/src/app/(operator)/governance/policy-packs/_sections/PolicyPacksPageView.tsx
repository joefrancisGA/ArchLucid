"use client";

import { cn } from "@/lib/utils";
import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";
import { PolicyPackImpactPreviewPanel } from "@/components/PolicyPackImpactPreviewPanel";
import { PolicyPackImpactSimulationCard } from "@/components/PolicyPackImpactSimulationCard";
import { PolicyPackBasisStatusBanner } from "@/components/governance/PolicyPackBasisStatusBanner";
import { buildPolicyPackEnforcedRuleRows } from "@/lib/policy-pack-enforced-rules";
import {
  policyPacksPageSubtitle,
} from "@/lib/policy-packs-page";
import {
  policyPacksRefreshAssistReaderLine,
  policyPacksRefreshAssistReaderLineBuyerPolished,
} from "@/lib/enterprise-controls-context-copy";
import { PolicyPacksActivePackSummaryCard } from "./PolicyPacksActivePackSummaryCard";
import { PolicyPacksCatalogSection } from "./PolicyPacksCatalogSection";
import { PolicyPacksEnforcedRulesTable } from "./PolicyPacksEnforcedRulesTable";
import { PolicyPacksInspectSection } from "./PolicyPacksInspectSection";
import { PolicyPacksLifecycleSection } from "./PolicyPacksLifecycleSection";
import { PolicyPacksMarketingIntro } from "./PolicyPacksMarketingIntro";
import { PolicyPacksMetricStrip } from "./PolicyPacksMetricStrip";
import { PolicyPacksPageHeader } from "./PolicyPacksPageHeader";
import { PolicyPacksRegisteredListSection } from "./PolicyPacksRegisteredListSection";
import { PolicyPacksAdvancedAuthoringPanel } from "./PolicyPacksAdvancedAuthoringPanel";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { PatternLibraryPolicyPacksVocabularyRail } from "@/components/PatternLibraryPolicyPacksVocabularyRail";
import { PolicyPackDetailHubVocabularyRail } from "@/components/PolicyPackDetailHubVocabularyRail";
import { PolicyPacksStandardsVocabularyRail } from "@/components/PolicyPacksStandardsVocabularyRail";
import { GovernanceSetupConfigHubsVocabularyRail } from "@/components/GovernanceSetupConfigHubsVocabularyRail";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
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

  return (
    <div className="w-full max-w-[1440px]">
      {m.buyerPolishedShell ? <PolicyPackBasisStatusBanner className="mb-3" /> : null}

      {m.buyerPolishedShell ? (
        <LayerHeader
          pageKey="policy-packs"
          density="compact"
className="mb-3"
        />
      ) : null}

      <PolicyPacksPageHeader
        subtitle={policyPacksPageSubtitle(m.buyerPolishedShell)}
        refreshing={m.loading}
        lastRefreshedAt={m.lastRefreshedAt}
        onRefresh={m.load}
      />

      <PolicyPacksStandardsVocabularyRail currentSurfaceId="policy-packs" />
      <PatternLibraryPolicyPacksVocabularyRail currentSurfaceId="policy-packs" />
      <PolicyPackDetailHubVocabularyRail currentSurfaceId="policy-packs" />
      <GovernanceSetupConfigHubsVocabularyRail currentSurfaceId="policy-packs" />

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
          className={cn("mb-3 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="policy-packs-reader-assist"
        >
          {m.buyerPolishedShell
            ? policyPacksRefreshAssistReaderLineBuyerPolished
            : policyPacksRefreshAssistReaderLine}
        </p>
      ) : null}

      {m.buyerPolishedShell ? (
        <div className={cn("mb-4 grid gap-4", OPERATOR_LAYOUT.sectionStack)}>
          <PolicyPacksActivePackSummaryCard
            effective={m.effective}
            effectiveContent={m.effectiveContent}
            selectedPack={m.selectedPackSummary}
            enforcedRuleCount={enforcedRuleCount}
            canMutatePacks={m.canMutatePacks}
            onOpenCatalog={() => m.setPageTab("catalog")}
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
          {m.failure !== null ? (
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
            />
          ) : null}

          <div className={cn("flex flex-col gap-8", !m.canMutatePacks && "flex-col-reverse")}>
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
    </div>
  );
}
