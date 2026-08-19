"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";

import type { PolicyPackNaturalLanguageBuilderProps } from "./PolicyPackNaturalLanguageBuilder";
import type { PolicyPackVisualBuilderProps } from "./PolicyPackVisualBuilder";
import type { PolicyRuleAuthoringWizardProps } from "./PolicyRuleAuthoringWizard";

function policyPackAuthoringChunkLoading(label: string): React.JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      variant="panel"
      testId="policy-pack-authoring-chunk-loading"
    />
  );
}

export const PolicyRuleAuthoringWizardDeferred: ComponentType<PolicyRuleAuthoringWizardProps> = dynamic(
  () => import("./PolicyRuleAuthoringWizard").then((module) => module.PolicyRuleAuthoringWizard),
  {
    ssr: false,
    loading: () => policyPackAuthoringChunkLoading("Loading policy rule authoring wizard"),
  },
);

export const PolicyPackNaturalLanguageBuilderDeferred: ComponentType<PolicyPackNaturalLanguageBuilderProps> = dynamic(
  () =>
    import("./PolicyPackNaturalLanguageBuilder").then((module) => module.PolicyPackNaturalLanguageBuilder),
  {
    ssr: false,
    loading: () => policyPackAuthoringChunkLoading("Loading natural language policy builder"),
  },
);

export const PolicyPackVisualBuilderDeferred: ComponentType<PolicyPackVisualBuilderProps> = dynamic(
  () => import("./PolicyPackVisualBuilder").then((module) => module.PolicyPackVisualBuilder),
  {
    ssr: false,
    loading: () => policyPackAuthoringChunkLoading("Loading visual policy builder"),
  },
);

/** Preload the wizard chunk when the user opens generator handoff (TB-698). */
export function preloadPolicyRuleAuthoringWizardChunk(): void {
  void import("./PolicyRuleAuthoringWizard");
}
