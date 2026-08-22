"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { GovernanceFindingsQueueClientProps } from "./GovernanceFindingsQueueClient";

/** TB-2371 — findings queue off governance page First Load JS. */
export const GovernanceFindingsQueueClientDeferred: ComponentType<GovernanceFindingsQueueClientProps> =
  createDeferredComponentFromManifest("governance-findings-queue-client", {
    loadingTestId: "governance-findings-queue-deferred-chunk-loading",
  }) as ComponentType<GovernanceFindingsQueueClientProps>;
