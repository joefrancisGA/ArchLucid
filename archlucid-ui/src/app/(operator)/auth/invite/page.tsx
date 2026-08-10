import type { Metadata } from "next";
import { Suspense } from "react";

import { InvitationAcceptLoadingView } from "@/app/(operator)/auth/invite/InvitationAcceptLoadingView";
import { InvitationAcceptPageClient } from "@/app/(operator)/auth/invite/InvitationAcceptPageClient";
import { AuthFlowShell } from "@/components/auth/AuthFlowShell";
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
    <AuthFlowShell showEvaluationSignupLink={false}>
      <InvitationAcceptLoadingView />
    </AuthFlowShell>
  );
}

export default function InvitationAcceptPage() {
  return (
    <Suspense fallback={<InvitationAcceptLoading />}>
      <InvitationAcceptPageClient />
    </Suspense>
  );
}
