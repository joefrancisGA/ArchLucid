"use client";

import { useEffect } from "react";

import { runSignedInDedicatedScopeBootstrap } from "@/lib/auth/live-seat-scope-bootstrap-redirect";
import { isLikelySignedIn } from "@/lib/oidc/session";

/** Signed-in operators land on their dedicated workspace instead of dev-default demo scope. */
export function OperatorWorkspaceScopeBootstrapHost(): null {
  useEffect(() => {
    if (!isLikelySignedIn()) {
      return;
    }

    void runSignedInDedicatedScopeBootstrap();
  }, []);

  return null;
}
