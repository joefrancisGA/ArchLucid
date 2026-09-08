import type { Metadata } from "next";
import { Suspense } from "react";

import { PostAuthBootstrapBuyerChrome } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapBuyerChrome";
import { PostAuthBootstrapClient } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapClient";
import { PostAuthBootstrapLoadingView } from "@/app/(operator)/auth/bootstrap/PostAuthBootstrapLoadingView";
import {
  AUTH_BOOTSTRAP_PAGE_DESCRIPTION,
  AUTH_BOOTSTRAP_PAGE_TITLE,
} from "@/lib/auth/auth-bootstrap-page-copy";

export const metadata: Metadata = {
  title: AUTH_BOOTSTRAP_PAGE_TITLE,
  description: AUTH_BOOTSTRAP_PAGE_DESCRIPTION,
};

function PostAuthBootstrapLoading() {
  return (
    <PostAuthBootstrapBuyerChrome>
      <PostAuthBootstrapLoadingView />
    </PostAuthBootstrapBuyerChrome>
  );
}

export default function PostAuthBootstrapPage() {
  return (
    <Suspense fallback={<PostAuthBootstrapLoading />}>
      <PostAuthBootstrapClient />
    </Suspense>
  );
}
