"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import type { SignedRecordsListTableProps } from "./SignedRecordsListTable";

function SignedRecordsListDeferredLoading(props: { readonly label: string }): React.JSX.Element {
  return (
    <div
      className={cn(
        "min-h-24 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800",
        OPERATOR_TYPOGRAPHY.body,
      )}
      role="status"
      aria-label={props.label}
      data-testid="signed-records-list-deferred-chunk-loading"
    />
  );
}

/** EnterpriseTable cluster — deferred so list chrome paints first (wave 11 hub First Load). */
export const SignedRecordsListTableDeferred: ComponentType<SignedRecordsListTableProps> = dynamic(
  () => import("./SignedRecordsListTable").then((module) => module.SignedRecordsListTable),
  {
    ssr: false,
    loading: () => <SignedRecordsListDeferredLoading label="Loading signed review records table" />,
  },
);
