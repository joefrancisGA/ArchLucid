import type { Metadata } from "next";
import { Suspense } from "react";

import { InvitationAcceptBuyerChrome } from "@/app/(operator)/auth/invite/InvitationAcceptBuyerChrome";
import { InvitationAcceptLoadingView } from "@/app/(operator)/auth/invite/InvitationAcceptLoadingView";
import { InvitationAcceptPageClient } from "@/app/(operator)/auth/invite/InvitationAcceptPageClient";
import {
  AUTH_INVITE_PAGE_DESCRIPTION,
  AUTH_INVITE_PAGE_TITLE,
} from "@/lib/auth/auth-invite-page-copy";

export const metadata: Metadata = {
  title: AUTH_INVITE_PAGE_TITLE,
  description: AUTH_INVITE_PAGE_DESCRIPTION,
};

function InvitationAcceptLoading() {
  return (
    <InvitationAcceptBuyerChrome>
      <InvitationAcceptLoadingView />
    </InvitationAcceptBuyerChrome>
  );
}

export default function InvitationAcceptPage() {
  return (
    <Suspense fallback={<InvitationAcceptLoading />}>
      <InvitationAcceptPageClient />
    </Suspense>
  );
}
