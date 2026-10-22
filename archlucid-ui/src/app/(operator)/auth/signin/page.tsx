import type { Metadata } from "next";
import { Suspense } from "react";

import { SignInClient } from "@/app/(operator)/auth/signin/SignInClient";
import { SignInBuyerChrome } from "@/app/(operator)/auth/signin/SignInBuyerChrome";
import { SignInLoadingView } from "@/app/(operator)/auth/signin/SignInLoadingView";
import {
  authSignInPageMetadataDescription,
  authSignInPageMetadataTitle,
} from "@/lib/auth/auth-signin-page-copy";
import { resolveProductLineIdForServer } from "@/lib/product-line/resolve-product-line-id-server";

export async function generateMetadata(): Promise<Metadata> {
  const productLine = await resolveProductLineIdForServer();

  return {
    title: authSignInPageMetadataTitle(productLine),
    description: authSignInPageMetadataDescription(productLine),
  };
}

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
