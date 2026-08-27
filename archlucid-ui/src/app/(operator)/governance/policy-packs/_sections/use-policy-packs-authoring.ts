"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";

import { POLICY_RULE_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";
import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance/governance-route-paths";
import { POLICY_PACKS_REVIEW_ID_QUERY_PARAM } from "@/lib/policy-packs-review-handoff";

import type { PolicyPacksAuthoringDeps } from "./policy-packs-authoring-deps";
import { usePolicyPacksCreatePublish } from "./use-policy-packs-create-publish";
import { usePolicyPacksGenerator } from "./use-policy-packs-generator";

export type { PolicyPacksAuthoringDeps } from "./policy-packs-authoring-deps";

export function usePolicyPacksAuthoring(deps: PolicyPacksAuthoringDeps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ruleIdFromUrl = searchParams.get(POLICY_RULE_ID_QUERY_PARAM)?.trim() ?? "";
  const pickedReviewId = searchParams.get(POLICY_PACKS_REVIEW_ID_QUERY_PARAM)?.trim() ?? "";

  const createPublish = usePolicyPacksCreatePublish(deps);
  const generator = usePolicyPacksGenerator(deps, createPublish);

  useEffect(() => {
    if (deps.packIdFromUrl.length === 0) {
      return;
    }

    if (!deps.packs.some((p) => p.policyPackId === deps.packIdFromUrl)) {
      return;
    }

    createPublish.setSelectedPackId(deps.packIdFromUrl);

    if (deps.pageTabFromUrl === "author") {
      deps.setPageTab("author");
      generator.setAuthoringToolsOpen(true);
      generator.setAuthoringAdvancedOpen(false);

      return;
    }

    deps.setPageTab("my-packs");
  }, [deps.packIdFromUrl, deps.packs, deps.pageTabFromUrl]);

  useEffect(() => {
    deps.setPageTab(deps.pageTabFromUrl);
  }, [deps.pageTabFromUrl]);

  const setPickedReviewId = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();
      const params = new URLSearchParams(searchParams.toString());

      if (trimmed.length > 0) {
        params.set(POLICY_PACKS_REVIEW_ID_QUERY_PARAM, trimmed);
      } else {
        params.delete(POLICY_PACKS_REVIEW_ID_QUERY_PARAM);
      }

      router.replace(`${GOVERNANCE_POLICY_PACKS_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  return {
    ...createPublish,
    ...generator,
    ruleIdFromUrl,
    pickedReviewId,
    setPickedReviewId,
  };
}
