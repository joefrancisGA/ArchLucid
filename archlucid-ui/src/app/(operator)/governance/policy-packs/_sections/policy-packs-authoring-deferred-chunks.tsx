"use client";

import type { ComponentType } from "react";

import {
  createDeferredComponentFromManifest,
  loadDeferredChunkFromManifest,
} from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { PolicyPackNaturalLanguageBuilderProps } from "./PolicyPackNaturalLanguageBuilder";
import type { PolicyPackVisualBuilderProps } from "./PolicyPackVisualBuilder";
import type { PolicyRuleAuthoringWizardProps } from "./PolicyRuleAuthoringWizard";

export const PolicyRuleAuthoringWizardDeferred: ComponentType<PolicyRuleAuthoringWizardProps> =
  createDeferredComponentFromManifest("policy-packs-authoring-wizard", {
    loadingTestId: "policy-pack-authoring-chunk-loading",
  });

export const PolicyPackNaturalLanguageBuilderDeferred: ComponentType<PolicyPackNaturalLanguageBuilderProps> =
  createDeferredComponentFromManifest("policy-packs-authoring-natural-language-builder", {
    loadingTestId: "policy-pack-authoring-chunk-loading",
  });

export const PolicyPackVisualBuilderDeferred: ComponentType<PolicyPackVisualBuilderProps> =
  createDeferredComponentFromManifest("policy-packs-authoring-visual-builder", {
    loadingTestId: "policy-pack-authoring-chunk-loading",
  });

/** Preload the wizard chunk when the user opens generator handoff (TB-698). */
export function preloadPolicyRuleAuthoringWizardChunk(): void {
  void loadDeferredChunkFromManifest("policy-packs-authoring-wizard")();
}
