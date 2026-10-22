"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { GovernanceFindingsQueueClientProps } from "./GovernanceFindingsQueueClient";

/** Findings queue client — deferred so route chrome paints first (TB-571 / wave 11 First Load). */
export const GovernanceFindingsQueueClientDeferred: ComponentType<GovernanceFindingsQueueClientProps> =
  createDeferredComponentFromManifest("governance-findings-queue-client", {
    loadingTestId: "governance-findings-deferred-chunk-loading",
  });
