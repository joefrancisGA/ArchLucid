import type { DeferredChunkManifestEntry } from "@/lib/operator/deferred-chunk-manifest";

/** TB-2371 — policy pack authoring deferred chunk catalog. */
export const POLICY_PACKS_AUTHORING_CHUNK_MANIFEST: readonly DeferredChunkManifestEntry[] = [
  {
    id: "policy-packs-authoring-wizard",
    label: "Loading policy rule authoring wizard",
    variant: "panel",
    modulePath: "@/app/(operator)/governance/policy-packs/_sections/PolicyRuleAuthoringWizard",
    exportName: "PolicyRuleAuthoringWizard",
  },
  {
    id: "policy-packs-authoring-natural-language-builder",
    label: "Loading natural language policy builder",
    variant: "panel",
    modulePath: "@/app/(operator)/governance/policy-packs/_sections/PolicyPackNaturalLanguageBuilder",
    exportName: "PolicyPackNaturalLanguageBuilder",
  },
  {
    id: "policy-packs-authoring-visual-builder",
    label: "Loading visual policy builder",
    variant: "panel",
    modulePath: "@/app/(operator)/governance/policy-packs/_sections/PolicyPackVisualBuilder",
    exportName: "PolicyPackVisualBuilder",
  },
] as const;
