import { SECURENOW_REMEDIATION_INSTANCES_PATH } from "@/lib/governance/governance-infrastructure-route-paths";
import { SECURENOW_REMEDIATION_FACTORY_PATH } from "@/lib/governance/governance-route-paths";
import { CLOUD_CONNECTIONS_PATH } from "@/lib/integrations-nav-paths";

export const SECURENOW_SELF_SERVICE_HEADING = "When you are stuck" as const;

export const SECURENOW_SELF_SERVICE_LEAD =
  "Four checks before you email. This is not a support SLA. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SELF_SERVICE_GUARDRAIL =
  "SecureNow does not change Azure. This page is not a support SLA." as const;

export type SecureNowSelfServiceStep = {
  readonly title: string;
  readonly body: string;
  readonly href?: string;
  readonly mailto?: string;
};

export const SECURENOW_SELF_SERVICE_STEPS: readonly SecureNowSelfServiceStep[] = [
  {
    title: "Collection missing or stale",
    body: "A missing or stale capture is a gap. It is not proof the environment is clean.",
    href: CLOUD_CONNECTIONS_PATH,
  },
  {
    title: "Connector will not finish",
    body: "Read the connector status. A failed connector is not a completed capture.",
    href: "/administration/connection-status",
  },
  {
    title: "No ranked path, or not verified",
    body: `An empty ranking is not proof you are secure. Not verified means a later capture, your attestation, completed analysis, or the postcondition is missing. Review the ranked path and the remediation tracker at ${SECURENOW_REMEDIATION_FACTORY_PATH} and ${SECURENOW_REMEDIATION_INSTANCES_PATH}.`,
    href: SECURENOW_REMEDIATION_FACTORY_PATH,
  },
  {
    title: "Still stuck",
    body: "Email support@archlucid.net with subject SecureNow. Include tenant, workspace, subscription, collection time, and path id when you have one. Do not paste secrets, tokens, or connection strings.",
    mailto: "mailto:support@archlucid.net?subject=SecureNow",
  },
] as const;
