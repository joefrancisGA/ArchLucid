"use client";

import { cn } from "@/lib/utils";
import { PolicyPacksRegisteredListSection } from "./PolicyPacksRegisteredListSection";
import { PolicyRuleAuthoringWizardDeferred } from "./policy-packs-authoring-deferred-chunks";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";
import { OPERATOR_LAYOUT, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type PolicyPacksAuthoringTabSectionProps = {
  readonly model: PolicyPacksPageViewModel;
};

/** First-class policy pack authoring surface — design, test-on-review, publish (Improvement 4). */
export function PolicyPacksAuthoringTabSection(props: PolicyPacksAuthoringTabSectionProps) {
  const m = props.model;

  return (
    <div className={OPERATOR_LAYOUT.sectionStack} data-testid="policy-packs-author-tab">
      <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        Map your organization&apos;s standards into curated policy rules. Use guided, visual, or natural-language builders on one workspace with inline review testing, then publish a version for workspace assignment.
      </p>

      <PolicyPacksRegisteredListSection
        buyerPolishedShell={m.buyerPolishedShell}
        canMutatePacks={m.canMutatePacks}
        packs={m.packs}
        effectivePackIds={new Set((m.effective?.packs ?? []).map((p) => p.policyPackId))}
        selectedPackId={m.selectedPackId}
        onSelectedPackIdChange={m.setSelectedPackId}
      />

      <PolicyRuleAuthoringWizardDeferred
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
        highlightRuleId={m.ruleIdFromUrl}
        initialInputMode={m.authoringWizardInputMode}
        scopedReviewId={m.pickedReviewId}
        onPickReview={m.setPickedReviewId}
      />
    </div>
  );
}
