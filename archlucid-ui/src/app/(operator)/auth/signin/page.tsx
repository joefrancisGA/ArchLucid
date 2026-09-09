import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInClient } from "@/app/(operator)/auth/signin/SignInClient";
import { SignInBuyerChrome } from "@/app/(operator)/auth/signin/SignInBuyerChrome";
import { SignInLoadingView } from "@/app/(operator)/auth/signin/SignInLoadingView";
import {
  AUTH_SIGNIN_PAGE_METADATA_DESCRIPTION,
  AUTH_SIGNIN_PAGE_METADATA_TITLE,
} from "@/lib/auth/auth-signin-page-copy";

export const metadata: Metadata = {
  title: AUTH_SIGNIN_PAGE_METADATA_TITLE,
  description: AUTH_SIGNIN_PAGE_METADATA_DESCRIPTION,
};

function SignInLoading(): React.JSX.Element {
  return (
    <SignInBuyerChrome showFooterPasswordlessExplanation={false} showFooterHelpLink={false}>
      <SignInLoadingView />
    </SignInBuyerChrome>
  );
}

export default function SignInPage(): React.JSX.Element {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInClient />
    </Suspense>
  );
}
