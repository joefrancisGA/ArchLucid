"use client";

import { cn } from "@/lib/utils";
import type { ReactElement } from "react";

import { AdvancedOptionsAccordion } from "@/components/AdvancedOptionsAccordion";
import { isStaticDemoPayloadFallbackEnabled } from "@/lib/operator/operator-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { PolicyPackGeneratorSection } from "./PolicyPackGeneratorSection";
import { PolicyPacksAuthoringTabSection } from "./PolicyPacksAuthoringTabSection";
import type { PolicyPacksPageTab, PolicyPacksPageViewModel } from "./policy-packs-page-view-model";

type PolicyPacksAdvancedAuthoringPanelProps = {
  readonly model: PolicyPacksPageViewModel;
  readonly authoringTab: Extract<PolicyPacksPageTab, "author" | "generator">;
  readonly onAuthoringTabChange: (tab: Extract<PolicyPacksPageTab, "author" | "generator">) => void;
};

/** Author rules and pack generator — default closed so My packs stays the primary surface. */
export function PolicyPacksAdvancedAuthoringPanel(props: PolicyPacksAdvancedAuthoringPanelProps): ReactElement | null {
  const m = props.model;

  if (m.buyerPolishedShell || !m.canMutatePacks || isStaticDemoPayloadFallbackEnabled()) {
    return null;
  }

  const authoringTab = props.authoringTab;

  return (
    <div data-testid="policy-packs-advanced-authoring">
      <AdvancedOptionsAccordion
        className="mb-8"
        open={m.authoringToolsOpen}
        onOpenChange={m.setAuthoringToolsOpen}
        triggerLabel="Authoring and generation tools"
      >
        <div
          className="mb-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Authoring tools mode"
        >
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5",
                OPERATOR_TYPOGRAPHY.tab,
                authoringTab === "author"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
              aria-pressed={authoringTab === "author"}
              onClick={() => {
                props.onAuthoringTabChange("author");
              }}
              data-testid="policy-packs-tab-author"
            >
              Author rules
            </button>
            <button
              type="button"
              className={cn(
                "rounded-md px-3 py-1.5",
                OPERATOR_TYPOGRAPHY.tab,
                authoringTab === "generator"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/60",
              )}
              aria-pressed={authoringTab === "generator"}
              onClick={() => {
                props.onAuthoringTabChange("generator");
              }}
              data-testid="policy-packs-tab-generator"
            >
              Generate
            </button>
        </div>

        {authoringTab === "author" ? <PolicyPacksAuthoringTabSection model={m} /> : null}

        {authoringTab === "generator" ? (
          <PolicyPackGeneratorSection
            canMutatePacks={m.canMutatePacks}
            loading={m.loading}
            name={m.name}
            description={m.description}
            packType={m.packType}
            publishVersion={m.publishVersion}
            generatedRuleCount={m.generatedRuleCount}
            validationErrors={m.generatedValidationErrors}
            onNameChange={m.setName}
            onDescriptionChange={m.setDescription}
            onPackTypeChange={m.setPackType}
            onGenerated={m.applyGeneratedPolicyPack}
            onCreatePack={m.onCreateFromGenerator}
            onOpenAuthoringWizard={m.openAuthoringWizardFromGenerator}
          />
        ) : null}
      </AdvancedOptionsAccordion>
    </div>
  );
}
