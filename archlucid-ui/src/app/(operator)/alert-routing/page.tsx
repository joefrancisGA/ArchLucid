import { redirect } from "next/navigation";

import { governanceAlertRulesTabHref } from "@/lib/governance-route-paths";

/** Legacy standalone route — routing lives on the Alert rules workspace. */
export default function AlertRoutingRedirectPage() {
  redirect(governanceAlertRulesTabHref("routing"));
}
