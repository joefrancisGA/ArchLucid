import { redirect } from "next/navigation";

import { GOVERNANCE_POLICY_PACKS_PATH } from "@/lib/governance-route-paths";

/** Legacy list path — canonical route is `/governance/policy-packs` (TB-405). */
export default function LegacyPolicyPacksListRedirectPage() {
  redirect(GOVERNANCE_POLICY_PACKS_PATH);
}
