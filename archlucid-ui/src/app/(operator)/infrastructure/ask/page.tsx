import type { Metadata } from "next";

import { InfrastructureAskClient } from "@/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient";
import { getRouteTitle } from "@/lib/route-titles";

export const metadata: Metadata = {
  title: getRouteTitle("/infrastructure/ask"),
};

/** SecureNow Infrastructure Ask — grounded questions with citation-backed answers. */
export default function SecureNowInfrastructureAskPage() {
  return <InfrastructureAskClient />;
}
