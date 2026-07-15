import type { Metadata } from "next";

import SignedRecordsListClient from "./_sections/SignedRecordsListClient";
import { SIGNED_RECORDS_LIST_PAGE_TITLE } from "./_sections/signed-records-list-copy";

export const metadata: Metadata = {
  title: SIGNED_RECORDS_LIST_PAGE_TITLE,
};

export default function SignedRecordsListPage() {
  return <SignedRecordsListClient />;
}
