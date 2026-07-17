"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { PolicyPackNaturalLanguageBuilderProps } from "./PolicyPackNaturalLanguageBuilder";
import type { PolicyPackVisualBuilderProps } from "./PolicyPackVisualBuilder";
import type { PolicyRuleAuthoringWizardProps } from "./PolicyRuleAuthoringWizard";

function PolicyPackAuthoringChunkLoading(props: { readonly label: string }) {
  return (
    <div
      className={cn(
        "h-32 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      aria-label={props.label}
      data-testid="policy-pack-authoring-chunk-loading"
    />
  );
}

export const PolicyRuleAuthoringWizardDeferred: ComponentType<PolicyRuleAuthoringWizardProps> = dynamic(
  () => import("./PolicyRuleAuthoringWizard").then((module) => module.PolicyRuleAuthoringWizard),
  {
    ssr: false,
    loading: () => <PolicyPackAuthoringChunkLoading label="Loading policy rule authoring wizard" />,
  },
);

export const PolicyPackNaturalLanguageBuilderDeferred: ComponentType<PolicyPackNaturalLanguageBuilderProps> = dynamic(
  () =>
    import("./PolicyPackNaturalLanguageBuilder").then((module) => module.PolicyPackNaturalLanguageBuilder),
  {
    ssr: false,
    loading: () => <PolicyPackAuthoringChunkLoading label="Loading natural language policy builder" />,
  },
);

export const PolicyPackVisualBuilderDeferred: ComponentType<PolicyPackVisualBuilderProps> = dynamic(
  () => import("./PolicyPackVisualBuilder").then((module) => module.PolicyPackVisualBuilder),
  {
    ssr: false,
    loading: () => <PolicyPackAuthoringChunkLoading label="Loading visual policy builder" />,
  },
);

/** Preload the wizard chunk when the user opens generator handoff (TB-698). */
export function preloadPolicyRuleAuthoringWizardChunk(): void {
  void import("./PolicyRuleAuthoringWizard");
}
