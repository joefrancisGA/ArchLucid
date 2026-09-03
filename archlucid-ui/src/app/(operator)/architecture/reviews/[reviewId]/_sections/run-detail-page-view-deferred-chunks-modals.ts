"use client";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

export const RunDetailExportDeliverableDialog = createDeferredComponentFromManifest(
  "run-detail-export-deliverable-dialog",
  { suppressLoading: true },
);

export const RunDetailGenerateAdrFromRunModal = createDeferredComponentFromManifest(
  "run-detail-generate-adr-from-run-modal",
  { suppressLoading: true },
);
