"use client";

import { useEffect } from "react";

import { bootstrapDedicatedWorkspaceScope } from "@/lib/operator/operator-scope-bootstrap";
import { isLikelySignedIn } from "@/lib/oidc/session";

/** Signed-in operators land on their dedicated workspace instead of dev-default demo scope. */
export function OperatorWorkspaceScopeBootstrapHost(): null {
  useEffect(() => {
    if (!isLikelySignedIn()) {
      return;
    }

    void bootstrapDedicatedWorkspaceScope();
  }, []);

  return null;
}
