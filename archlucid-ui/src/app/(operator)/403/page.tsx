import type { Metadata } from "next";

import { OperatorUnauthorizedPageClient } from "@/components/OperatorRoleGate";

export const metadata: Metadata = {
  title: "Unauthorized",
};

/** Shown when the signed-in principal lacks a recognized ArchLucid app role. */
export default function OperatorUnauthorizedPage() {
  return <OperatorUnauthorizedPageClient />;
}
