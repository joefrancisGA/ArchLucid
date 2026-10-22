"use client";

import type { JSX } from "react";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";
import { cn } from "@/lib/utils";

const sponsorBriefingLoadingWrapper = (): JSX.Element => (
  <div
    className={cn(
      "rounded-md border border-neutral-200 p-4 text-al-text-secondary dark:border-neutral-700",
      OPERATOR_TYPOGRAPHY.body,
    )}
    role="status"
    aria-live="polite"
  >
    Loading sponsor briefing…
  </div>
);

const roiHandoffLoadingWrapper = (): JSX.Element => (
  <div
    className={cn(
      "rounded-md border border-neutral-200 p-4 text-al-text-secondary dark:border-neutral-700",
      OPERATOR_TYPOGRAPHY.body,
    )}
    role="status"
    aria-live="polite"
  >
    Loading ROI validation handoff…
  </div>
);

export const EmailRunToSponsorBannerDeferred = createDeferredComponentFromManifest(
  "run-detail-email-run-to-sponsor-banner",
  { loadingWrapper: sponsorBriefingLoadingWrapper },
);

export const PilotRoiValidationHandoffClientDeferred = createDeferredComponentFromManifest(
  "run-detail-pilot-roi-validation-handoff",
  { loadingWrapper: roiHandoffLoadingWrapper },
);
