import { Suspense } from "react";
import type { Metadata } from "next";

import { SessionExpiredBuyerChrome } from "@/app/(operator)/auth/session-expired/SessionExpiredBuyerChrome";
import { SessionExpiredClient } from "@/app/(operator)/auth/session-expired/SessionExpiredClient";
import { SessionExpiredLoadingView } from "@/app/(operator)/auth/session-expired/SessionExpiredLoadingView";
import {
  SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION,
  SESSION_EXPIRED_PAGE_METADATA_TITLE,
} from "@/lib/auth/session-expired-page-copy";

export const metadata: Metadata = {
  title: SESSION_EXPIRED_PAGE_METADATA_TITLE,
  description: SESSION_EXPIRED_PAGE_METADATA_DESCRIPTION,
};

function SessionExpiredLoading(): React.JSX.Element {
  return (
    <SessionExpiredBuyerChrome>
      <SessionExpiredLoadingView />
    </SessionExpiredBuyerChrome>
  );
}

export default function SessionExpiredPage(): React.JSX.Element {
  return (
    <Suspense fallback={<SessionExpiredLoading />}>
      <SessionExpiredClient />
    </Suspense>
  );
}
