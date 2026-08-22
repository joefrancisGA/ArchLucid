import type { Metadata } from "next";

import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "./_sections/signed-records-list-copy";

import { SignedRecordsListClientDeferred } from "./_sections/signed-records-list-deferred-chunks";

export const metadata: Metadata = {
  title: SIGNED_RECORDS_LIST_PAGE_TITLE,
};

/** Sealed records list with deferred client chunk (TB-2061); route `loading.tsx` supplies the navigation shell. */
export default function SignedRecordsListPage() {
  return <SignedRecordsListClientDeferred />;
}
