"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { isAcceleratorPackId } from "@/lib/accelerator-wizard-presets";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator/operator-home-example-request";
import { resolveSpecialtyReviewCloudFromSearchParam } from "@/lib/specialty-review-templates";
import {
  parseWizardPresetDeeplinkToken,
  resolveWizardPresetIdFromDeeplink,
} from "@/lib/wizard-preset-deeplink";
import { isZeroConfigDemoQuery, resolveZeroConfigDemoScenarioId } from "@/lib/zero-config-demo-mode";

import { tryParseSampleRunQuery } from "./new-run-wizard-steps";

/**
 * Every way a link can pre-aim the full guided wizard: sample run, pilot baseline, accelerator pack,
 * follow-up source, zero-config demo, example request template, and preset deep link.
 *
 * Resolved in one place because the deep-link surface is the part of this wizard most likely to grow,
 * and because several of these options gate each other (an accelerator link outranks a preset link).
 */
export type NewRunWizardIntakeParams = ReturnType<typeof useNewRunWizardIntakeParams>;

export function useNewRunWizardIntakeParams() {
  const searchParams = useSearchParams();

  const featuredSampleRunId = useMemo(
    () => tryParseSampleRunQuery(searchParams?.get("sampleRunId") ?? null),
    [searchParams],
  );
  const baselineFirst = useMemo(() => searchParams?.get("baseline") === "1", [searchParams]);
  const acceleratorPackId = useMemo(() => {
    const raw = searchParams?.get("accelerator")?.trim() ?? "";

    if (!isAcceleratorPackId(raw)) {
      return null;
    }

    return raw;
  }, [searchParams]);
  const followUpSourceRunId = useMemo(
    () => tryParseSampleRunQuery(searchParams?.get("sourceRunId") ?? null),
    [searchParams],
  );
  const zeroConfigDemo = useMemo(() => isZeroConfigDemoQuery(searchParams), [searchParams]);
  const zeroConfigScenarioId = useMemo(
    () => resolveZeroConfigDemoScenarioId(searchParams),
    [searchParams],
  );
  const exampleTemplate = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null)
        .template,
    [searchParams],
  );
  const reviewIntakeCloudProvider = useMemo(
    () => resolveSpecialtyReviewCloudFromSearchParam(searchParams?.get("cloud")),
    [searchParams],
  );
  const presetDeeplinkToken = useMemo(
    () => parseWizardPresetDeeplinkToken(searchParams?.get("preset")),
    [searchParams],
  );
  const presetDeeplinkPresetId = useMemo(
    () => resolveWizardPresetIdFromDeeplink(searchParams?.get("preset")),
    [searchParams],
  );

  return {
    featuredSampleRunId,
    baselineFirst,
    acceleratorPackId,
    followUpSourceRunId,
    zeroConfigDemo,
    zeroConfigScenarioId,
    exampleTemplate,
    reviewIntakeCloudProvider,
    presetDeeplinkToken,
    presetDeeplinkPresetId,
  };
}
