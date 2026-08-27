"use client";

import { useCallback, useEffect, useState } from "react";

import { applyGeneratedCuratedPolicyPack } from "@/lib/apply-generated-curated-policy-pack";
import type { CuratedRulesDocument } from "@/lib/policy/policy-pack-curated-rules-v1";
import { preloadPolicyRuleAuthoringWizardChunk } from "./policy-packs-authoring-deferred-chunks";
import type { PolicyPacksAuthoringDeps } from "./policy-packs-authoring-deps";
import type { PolicyPacksCreatePublishSlice } from "./use-policy-packs-create-publish";

export function usePolicyPacksGenerator(
  deps: PolicyPacksAuthoringDeps,
  createPublish: PolicyPacksCreatePublishSlice,
) {
  const [generatedRuleCount, setGeneratedRuleCount] = useState(0);
  const [generatedValidationErrors, setGeneratedValidationErrors] = useState<readonly string[]>([]);
  const [authoringWizardInputMode, setAuthoringWizardInputMode] = useState<"guided" | "visual" | "json" | "ai">("guided");
  const [authoringAdvancedOpen, setAuthoringAdvancedOpen] = useState(false);
  const [authoringToolsOpen, setAuthoringToolsOpen] = useState(
    deps.pageTabFromUrl === "author" || deps.pageTabFromUrl === "generator",
  );

  useEffect(() => {
    if (deps.pageTab === "author" || deps.pageTab === "generator") {
      setAuthoringToolsOpen(true);
    }
  }, [deps.pageTab]);

  const applyGeneratedPolicyPack = useCallback(
    (document: CuratedRulesDocument) => {
      const result = applyGeneratedCuratedPolicyPack({
        document,
        existingName: createPublish.name,
        existingDescription: createPublish.description,
        publishVersion: createPublish.publishVersion,
        packType: createPublish.packType,
      });

      setGeneratedRuleCount(result.ruleCount);
      setGeneratedValidationErrors(result.validationErrors);

      if (result.validationErrors.length > 0) {
        return;
      }

      createPublish.setName(result.name);
      createPublish.setDescription(result.description);
      createPublish.setPackType(result.packType);
      createPublish.setPublishVersion(result.publishVersion);
      createPublish.syncPolicyContentJson(result.contentJson);
    },
    [
      createPublish.description,
      createPublish.name,
      createPublish.packType,
      createPublish.publishVersion,
      createPublish.setDescription,
      createPublish.setName,
      createPublish.setPackType,
      createPublish.setPublishVersion,
      createPublish.syncPolicyContentJson,
    ],
  );

  const openAuthoringWizardFromGenerator = useCallback(() => {
    preloadPolicyRuleAuthoringWizardChunk();
    setAuthoringWizardInputMode("visual");
    setAuthoringToolsOpen(true);
    deps.setPageTab("author");

    const deadlineMs = Date.now() + 5000;

    const tryScrollToWizard = () => {
      const wizard = globalThis.document.querySelector("[data-testid='policy-rule-authoring-wizard']");

      if (wizard !== null) {
        wizard.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }

      if (Date.now() < deadlineMs) {
        window.setTimeout(tryScrollToWizard, 100);
      }
    };

    window.setTimeout(tryScrollToWizard, 0);
  }, []);

  const onCreateFromGenerator = useCallback(async () => {
    deps.setPageTab("my-packs");
    await createPublish.onCreate();
  }, [createPublish.onCreate]);

  return {
    generatedRuleCount,
    generatedValidationErrors,
    authoringWizardInputMode,
    authoringAdvancedOpen,
    setAuthoringAdvancedOpen,
    authoringToolsOpen,
    setAuthoringToolsOpen,
    applyGeneratedPolicyPack,
    openAuthoringWizardFromGenerator,
    onCreateFromGenerator,
  };
}
