"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { DeferredChunkLoading } from "@/components/ui/deferred-chunk-loading";

import type { SignedRecordsListTableProps } from "./SignedRecordsListTable";

function signedRecordsListDeferredLoading(label: string): React.JSX.Element {
  return (
    <DeferredChunkLoading
      label={label}
      testId="signed-records-list-deferred-chunk-loading"
    />
  );
}

/** EnterpriseTable cluster — deferred so list chrome paints first (wave 11 hub First Load). */
export const SignedRecordsListTableDeferred: ComponentType<SignedRecordsListTableProps> = dynamic(
  () => import("./SignedRecordsListTable").then((module) => module.SignedRecordsListTable),
  {
    ssr: false,
    loading: () => signedRecordsListDeferredLoading("Loading signed review records table"),
  },
);
