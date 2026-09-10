import { RemediationPatternsClient } from "@/app/(operator)/governance/remediation-patterns/RemediationPatternsClient";

/** SecureNow remediation pattern registry — list, version history, YAML import, SoD-gated approve. */
export default function SecureNowRemediationPatternsPage() {
  return <RemediationPatternsClient />;
}
