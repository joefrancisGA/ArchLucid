"use client";
import { cn } from "@/lib/utils";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";
import { PolicyPackImpactPreviewPanel } from "@/components/PolicyPackImpactPreviewPanel";
import { PolicyPackImpactSimulationCard } from "@/components/PolicyPackImpactSimulationCard";
import { PolicyPacksCatalogSection } from "./PolicyPacksCatalogSection";
import { PolicyPacksBuyerPolishedAdministratorNote } from "./PolicyPacksBuyerPolishedAdministratorNote";
import { PolicyPacksInspectSection } from "./PolicyPacksInspectSection";
import { PolicyPacksLifecycleSection } from "./PolicyPacksLifecycleSection";
import { PolicyPacksMarketingIntro } from "./PolicyPacksMarketingIntro";
import { PolicyPacksMetricStrip } from "./PolicyPacksMetricStrip";
import { PolicyPacksRefreshToolbar } from "./PolicyPacksRefreshToolbar";
import { PolicyPacksRegisteredListSection } from "./PolicyPacksRegisteredListSection";
import { PolicyPacksAdvancedAuthoringPanel } from "./PolicyPacksAdvancedAuthoringPanel";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

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

export function PolicyPacksPageView(props: Props) {
  const m = props.model;
  const surfaceTab = resolveSurfaceTab(m.pageTab);
  const authoringInnerTab = resolveAuthoringInnerTab(m.pageTab);

  return (
    <div className="max-w-5xl">
      <LayerHeader pageKey="policy-packs" />
      <OperatorPageHeader
        title="Policy packs"
        subtitle="Policy packs bundle rules and scope defaults. Assign them to workspaces to enforce governance."
      />
      <PolicyPacksMarketingIntro buyerPolishedShell={m.buyerPolishedShell} canMutatePacks={m.canMutatePacks} />

      <PolicyPacksMetricStrip
        buyerPolishedShell={m.buyerPolishedShell}
        packCount={m.packs.length}
        effective={m.effective}
        selectedPackSummary={m.selectedPackSummary}
      />

      <PolicyPacksRefreshToolbar
        buyerPolishedShell={m.buyerPolishedShell}
        canMutatePacks={m.canMutatePacks}
        loading={m.loading}
        onRefresh={m.load}
      />

      <nav className="mb-6" aria-label="Policy packs sections">
        <div className="flex flex-wrap gap-2 border-b border-border pb-2">
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1.5",
              OPERATOR_TYPOGRAPHY.tab,
              surfaceTab === "my-packs"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60",
            )}
            onClick={() => {
              m.setPageTab("my-packs");
            }}
            aria-label={surfaceTab === "my-packs" ? "My packs, current section" : "My packs"}
            data-testid="policy-packs-tab-my-packs"
          >
            My packs
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1.5",
              OPERATOR_TYPOGRAPHY.tab,
              surfaceTab === "catalog"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60",
            )}
            onClick={() => {
              m.setPageTab("catalog");
            }}
            aria-label={
              surfaceTab === "catalog" ? "Platform catalog, current section" : "Platform catalog"
            }
            data-testid="policy-packs-tab-catalog"
          >
            Catalog
          </button>
        </div>
      </nav>

      {surfaceTab === "catalog" ? (
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
      ) : null}

      {surfaceTab === "my-packs" && m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

      {surfaceTab === "my-packs" && !m.buyerPolishedShell ? (
        <PolicyPackImpactPreviewPanel
          effectiveContent={m.effectiveContent}
          selectedPackId={m.selectedPackId}
          packVersions={m.packVersions}
        />
      ) : null}

      {surfaceTab === "my-packs" ? (
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
          ) : (
            <PolicyPacksBuyerPolishedAdministratorNote />
          )}

          <PolicyPacksAdvancedAuthoringPanel
            model={m}
            authoringTab={authoringInnerTab}
            onAuthoringTabChange={m.setPageTab}
          />
        </div>
      ) : null}
    </div>
  );
}
