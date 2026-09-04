"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { applyGeneratedCuratedPolicyPack } from "@/lib/apply-generated-curated-policy-pack";
import type { CuratedRulesDocument } from "@/lib/policy/policy-pack-curated-rules-v1";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { policyPackAuthoringInputModeHrefFromSearch } from "@/lib/policy/policy-pack-authoring-input-mode-url";
import {
  parsePolicyPackAuthoringAdvancedOpenFromSearch,
  parsePolicyPackAuthoringToolsOpenFromSearch,
  policyPackAuthoringDisclosuresHrefFromSearch,
} from "@/lib/policy/policy-pack-authoring-disclosures-url";
import { preloadPolicyRuleAuthoringWizardChunk } from "./policy-packs-authoring-deferred-chunks";
import type { PolicyPacksAuthoringDeps } from "./policy-packs-authoring-deps";
import type { PolicyPacksCreatePublishSlice } from "./use-policy-packs-create-publish";

export function usePolicyPacksGenerator(
  deps: PolicyPacksAuthoringDeps,
  createPublish: PolicyPacksCreatePublishSlice,
) {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_POLICY_PACKS_PATH;
  const searchParams = useSearchParams();
  const [generatedRuleCount, setGeneratedRuleCount] = useState(0);
  const [generatedValidationErrors, setGeneratedValidationErrors] = useState<readonly string[]>([]);
  const [authoringWizardInputMode, setAuthoringWizardInputMode] = useState<"guided" | "visual" | "json" | "ai">("guided");
  const urlAuthoringAdvancedOpen = parsePolicyPackAuthoringAdvancedOpenFromSearch(searchParams.get("advanced"));
  const urlAuthoringToolsOpen = parsePolicyPackAuthoringToolsOpenFromSearch(searchParams.get("tools"));
  const [authoringAdvancedOpen, setAuthoringAdvancedOpenState] = useState(urlAuthoringAdvancedOpen);
  const [authoringToolsOpen, setAuthoringToolsOpenState] = useState(
    urlAuthoringToolsOpen || deps.pageTabFromUrl === "author" || deps.pageTabFromUrl === "generator",
  );

  const syncAuthoringDisclosuresToUrl = useCallback(
    (patch: { advancedOpen?: boolean; toolsOpen?: boolean }) => {
      router.replace(
        policyPackAuthoringDisclosuresHrefFromSearch(searchParams.toString(), {
          advancedOpen: patch.advancedOpen ?? authoringAdvancedOpen,
          toolsOpen: patch.toolsOpen ?? authoringToolsOpen,
        }, pathname),
        { scroll: false },
      );
    },
    [authoringAdvancedOpen, authoringToolsOpen, pathname, router, searchParams],
  );

  const setAuthoringAdvancedOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setAuthoringAdvancedOpenState((prev) => {
        const resolved = typeof value === "function" ? value(prev) : value;
        syncAuthoringDisclosuresToUrl({ advancedOpen: resolved });

        return resolved;
      });
    },
    [syncAuthoringDisclosuresToUrl],
  );

  const setAuthoringToolsOpen = useCallback(
    (value: boolean | ((prev: boolean) => boolean)) => {
      setAuthoringToolsOpenState((prev) => {
        const resolved = typeof value === "function" ? value(prev) : value;
        syncAuthoringDisclosuresToUrl({ toolsOpen: resolved });

        return resolved;
      });
    },
    [syncAuthoringDisclosuresToUrl],
  );

  useEffect(() => {
    setAuthoringAdvancedOpenState(parsePolicyPackAuthoringAdvancedOpenFromSearch(searchParams.get("advanced")));
    setAuthoringToolsOpenState(
      parsePolicyPackAuthoringToolsOpenFromSearch(searchParams.get("tools"))
        || deps.pageTab === "author"
        || deps.pageTab === "generator",
    );
  }, [deps.pageTab, searchParams]);

  useEffect(() => {
    if (deps.pageTab === "author" || deps.pageTab === "generator") {
      setAuthoringToolsOpenState(true);
      syncAuthoringDisclosuresToUrl({ toolsOpen: true });
    }
  }, [deps.pageTab, syncAuthoringDisclosuresToUrl]);

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
    router.replace(policyPackAuthoringInputModeHrefFromSearch(searchParams.toString(), "visual", pathname), {
      scroll: false,
    });
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
  }, [deps, pathname, router, searchParams]);

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
