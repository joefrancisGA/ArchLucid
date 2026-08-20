"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const AlertRulesContentDeferred: ComponentType = createDeferredComponentFromManifest(
  "alert-rules-hub-conditions",
  { loadingTestId: "alert-rules-hub-tab-chunk-loading" },
);

export const AlertRoutingContentDeferred: ComponentType = createDeferredComponentFromManifest(
  "alert-rules-hub-routing",
  { loadingTestId: "alert-rules-hub-tab-chunk-loading" },
);

export const CompositeAlertRulesContentDeferred: ComponentType = createDeferredComponentFromManifest(
  "alert-rules-hub-composite-rules",
  { loadingTestId: "alert-rules-hub-tab-chunk-loading" },
);

export const AlertSimulationTuningSectionDeferred: ComponentType = createDeferredComponentFromManifest(
  "alert-rules-hub-simulation-tuning",
  { loadingTestId: "alert-rules-hub-tab-chunk-loading" },
);
