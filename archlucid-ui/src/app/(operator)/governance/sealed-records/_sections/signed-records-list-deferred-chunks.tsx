"use client";

import type { ComponentType } from "react";

import { createDeferredComponentFromManifest } from "@/lib/operator/load-deferred-chunk-from-manifest";

import type { SignedRecordsListTableProps } from "./SignedRecordsListTable";

/** EnterpriseTable cluster — deferred so list chrome paints first (wave 11 hub First Load). */
export const SignedRecordsListTableDeferred: ComponentType<SignedRecordsListTableProps> =
  createDeferredComponentFromManifest("signed-records-list-table", {
    loadingTestId: "signed-records-list-deferred-chunk-loading",
  });

export const SignedRecordsListClientDeferred = createDeferredComponentFromManifest(
  "signed-records-list-client",
  { loadingTestId: "signed-records-list-deferred-chunk-loading" },
);
