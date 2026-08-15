import type { Metadata } from "next";
import dynamic from "next/dynamic";

import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "./_sections/signed-records-list-copy";

const SignedRecordsListClient = dynamic(() => import("./_sections/SignedRecordsListClient"));

export const metadata: Metadata = {
  title: SIGNED_RECORDS_LIST_PAGE_TITLE,
};

/** Sealed records list with deferred client chunk (TB-2061); route `loading.tsx` supplies the navigation shell. */
export default function SignedRecordsListPage() {
  return <SignedRecordsListClient />;
}
