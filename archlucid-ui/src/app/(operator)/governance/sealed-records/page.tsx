import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Suspense } from "react";

import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "./_sections/signed-records-list-copy";

const SignedRecordsListClient = dynamic(
  () => import("./_sections/SignedRecordsListClient"),
  {
    loading: () => (
      <div
        className="min-h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
        role="status"
        aria-label="Loading sealed records"
        data-testid="signed-records-list-chunk-loading"
      />
    ),
  },
);

export const metadata: Metadata = {
  title: SIGNED_RECORDS_LIST_PAGE_TITLE,
};

/** Sealed records list with deferred client chunk (TB-2061). */
export default function SignedRecordsListPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-48 animate-pulse rounded-md border border-neutral-200 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800"
          role="status"
          aria-label="Loading sealed records"
          data-testid="signed-records-list-suspense-fallback"
        />
      }
    >
      <SignedRecordsListClient />
    </Suspense>
  );
}
