"use client";

import { PolicyRuleAuthoringWizard } from "./PolicyRuleAuthoringWizard";
import { PolicyPackJsonValidatorPanel } from "./PolicyPackJsonValidatorPanel";
import { PolicyPacksRegisteredListSection } from "./PolicyPacksRegisteredListSection";
import type { PolicyPacksPageViewModel } from "./policy-packs-page-view-model";

type PolicyPacksAuthoringTabSectionProps = {
  readonly model: PolicyPacksPageViewModel;
};

/** First-class policy pack authoring surface — design, test-on-review, publish (Improvement 4). */
export function PolicyPacksAuthoringTabSection(props: PolicyPacksAuthoringTabSectionProps) {
  const m = props.model;

  return (
    <div className="space-y-8" data-testid="policy-packs-author-tab">
      <p className="m-0 max-w-prose text-sm text-neutral-700 dark:text-neutral-300">
        Map your organization&apos;s standards into curated policy rules. Author in guided, visual, JSON, or natural-language
        modes; validate against a committed review; then publish a version for workspace assignment.
      </p>

      <PolicyPacksRegisteredListSection
        buyerPolishedShell={m.buyerPolishedShell}
        canMutatePacks={m.canMutatePacks}
        packs={m.packs}
        effectivePackIds={new Set((m.effective?.packs ?? []).map((p) => p.policyPackId))}
        selectedPackId={m.selectedPackId}
        onSelectedPackIdChange={m.setSelectedPackId}
      />

      <PolicyPackJsonValidatorPanel />

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
        highlightRuleId={m.ruleIdFromUrl}
        initialInputMode={m.authoringWizardInputMode}
      />
    </div>
  );
}
