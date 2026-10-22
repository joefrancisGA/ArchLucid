import type { Metadata } from "next";

import { OperatorAccessDeniedPageClient } from "@/components/operator/OperatorAccessDeniedPageClient";

export const metadata: Metadata = {
  title: "Access denied",
  description:
    "Your account is signed in but does not have an ArchLucid app role for this tenant. Ask your administrator for access.",
};

/** Shown when the signed-in principal lacks a recognized ArchLucid app role (HTTP 403). */
export default function OperatorUnauthorizedPage() {
  return <OperatorAccessDeniedPageClient />;
}
