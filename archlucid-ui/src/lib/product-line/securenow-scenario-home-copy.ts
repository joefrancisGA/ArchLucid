import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import { SECURENOW_SAMPLE_FIXTURE_LINE } from "@/lib/marketing/securenow-sample-copy";

export const SECURENOW_SCENARIO_HOME_SECTION_HEADING = "Fixture walks" as const;

export const SECURENOW_SCENARIO_HOME_SECTION_LEAD =
  "Pick one fixture. Do not present it as a customer outcome. SecureNow beta remains NO_GO." as const;

export const SECURENOW_SCENARIO_HOME_ROWS: readonly SecureNowHomeDestinationRow[] = [
  {
    href: "/security/remediation-factory?pathId=fixture-path-01",
    label: "Standing privilege path",
    summary: `${SECURENOW_SAMPLE_FIXTURE_LINE} Open fixture-path-01 and read the cited hops.`,
  },
  {
    href: "/integrations/cloud-connections",
    label: "Collection gap",
    summary: `${SECURENOW_SAMPLE_FIXTURE_LINE} A missing capture is not a clean bill of health.`,
  },
  {
    href: "/security/remediation-factory?pathId=fixture-path-02",
    label: "Second ranked path (start here)",
    summary:
      `${SECURENOW_SAMPLE_FIXTURE_LINE} Open fixture-path-02 in Path inspect, or compare on the public sample.`,
    recommendedFirst: true,
  },
  {
    href: "/security/remediation-factory?pathId=fixture-path-01#cut-points",
    label: "Advisory cut only",
    summary: `${SECURENOW_SAMPLE_FIXTURE_LINE} SecureNow recommends and does not change Azure.`,
  },
  {
    href: "/administration/securenow-first-hour#stop",
    label: "Not verified",
    summary: `${SECURENOW_SAMPLE_FIXTURE_LINE} Missing evidence stays not verified.`,
  },
  {
    href: "/administration/securenow-scenario-walks#contributor-role-between-snapshots",
    label: "Contributor between captures",
    summary: `${SECURENOW_SAMPLE_FIXTURE_LINE} A unit fixture is not a sponsor demo.`,
  },
] as const;
