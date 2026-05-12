"use client";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { OperatorPageHeader } from "@/components/OperatorPageHeader";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator-static-demo";
import { cn } from "@/lib/utils";

import { PolicyPacksBuyerPolishedAdministratorNote } from "./PolicyPacksBuyerPolishedAdministratorNote";
import { PolicyPacksInspectSection } from "./PolicyPacksInspectSection";
import { PolicyPacksLifecycleSection } from "./PolicyPacksLifecycleSection";
import { PolicyPacksMarketingIntro } from "./PolicyPacksMarketingIntro";
import { PolicyPacksMetricStrip } from "./PolicyPacksMetricStrip";
import { PolicyPacksRefreshToolbar } from "./PolicyPacksRefreshToolbar";
import { PolicyPacksRegisteredListSection } from "./PolicyPacksRegisteredListSection";
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

      {m.failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={m.failure.problem}
            fallbackMessage={m.failure.message}
            correlationId={m.failure.correlationId}
          />
        </div>
      ) : null}

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
    </div>
  );
}
