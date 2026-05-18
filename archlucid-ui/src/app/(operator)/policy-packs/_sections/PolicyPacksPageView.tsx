"use client";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { cn } from "@/lib/utils";

import { PolicyPacksCatalogSection } from "./PolicyPacksCatalogSection";
import { PolicyPacksBuyerPolishedAdministratorNote } from "./PolicyPacksBuyerPolishedAdministratorNote";
import { PolicyPacksInspectSection } from "./PolicyPacksInspectSection";
import { PolicyPacksLifecycleSection } from "./PolicyPacksLifecycleSection";
import { PolicyPacksMarketingIntro } from "./PolicyPacksMarketingIntro";
import { PolicyPacksMetricStrip } from "./PolicyPacksMetricStrip";
import { PolicyPacksRefreshToolbar } from "./PolicyPacksRefreshToolbar";
import { PolicyPacksRegisteredListSection } from "./PolicyPacksRegisteredListSection";
import { PolicyRuleAuthoringWizard } from "./PolicyRuleAuthoringWizard";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";

type Props = {
  readonly model: PolicyPacksPageViewModel;
};

export function PolicyPacksPageView(props: Props) {
  const m = props.model;

  return (
    <div className="max-w-5xl">
      <LayerHeader pageKey="policy-packs" />
      <OperatorPageHeader title="Policy packs" helpKey="policy-packs" />
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
              "rounded-md px-3 py-1.5 text-sm font-medium",
              m.pageTab === "my-packs"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60",
            )}
            onClick={() => {
              m.setPageTab("my-packs");
            }}
            aria-label={m.pageTab === "my-packs" ? "My packs, current section" : "My packs"}
            data-testid="policy-packs-tab-my-packs"
          >
            My packs
          </button>
          <button
            type="button"
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium",
              m.pageTab === "catalog"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/60",
            )}
            onClick={() => {
              m.setPageTab("catalog");
            }}
            aria-label={
              m.pageTab === "catalog" ? "Platform catalog, current section" : "Platform catalog"
            }
            data-testid="policy-packs-tab-catalog"
          >
            Catalog
          </button>
        </div>
      </nav>

      {m.pageTab === "catalog" ? (
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

      {m.pageTab === "my-packs" && m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

      {m.pageTab === "my-packs" ? (
        <div className={cn("flex flex-col gap-8", !m.canMutatePacks && "flex-col-reverse")}>
          <PolicyPacksRegisteredListSection
            buyerPolishedShell={m.buyerPolishedShell}
            canMutatePacks={m.canMutatePacks}
            packs={m.packs}
            selectedPackId={m.selectedPackId}
            onSelectedPackIdChange={m.setSelectedPackId}
          />

          {!m.buyerPolishedShell ? (
            <AdvancedOptionsAccordion className="mb-8">
              {isStaticDemoPayloadFallbackEnabled() ? null : (
                <PolicyRuleAuthoringWizard
                  canMutatePacks={m.canMutatePacks}
                  loading={m.loading}
                  bundledPublishBlocked={m.bundledPublishBlocked}
                  selectedPackId={m.selectedPackId}
                  policyContentJson={m.publishJson}
                  onPolicyContentJsonSync={m.syncPolicyContentJson}
                  name={m.name}
                  onNameChange={m.setName}
                  description={m.description}
                  onDescriptionChange={m.setDescription}
                  packType={m.packType}
                  onPackTypeChange={m.setPackType}
                  publishVersion={m.publishVersion}
                  onPublishVersionChange={m.setPublishVersion}
                  onCreate={m.onCreate}
                  onPublish={m.onPublish}
                />
              )}
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
          ) : (
            <PolicyPacksBuyerPolishedAdministratorNote />
          )}
        </div>
      ) : null}
    </div>
  );
}
