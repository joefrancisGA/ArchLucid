import type { ResourceHubTab } from "@/lib/infra-evidence/infra-evidence-hub-types";

export function formatResourceHubTabViewLabel(tab: ResourceHubTab): string {
  switch (tab) {
    case "overview":
      return "View overview in hub";
    case "findings":
      return "View findings in hub";
    case "remediation":
      return "View remediation in hub";
    case "drift":
      return "View drift in hub";
    case "diagram":
      return "View diagram correspondence in hub";
    case "terraform":
      return "View terraform mapping in hub";
    case "audit":
      return "View audit lineage in hub";
    default:
      return "Open resource evidence hub";
  }
}

export function formatResourceHubTabCompactLabel(tab: ResourceHubTab): string {
  switch (tab) {
    case "overview":
      return "Overview";
    case "findings":
      return "Findings";
    case "remediation":
      return "Remediation";
    case "drift":
      return "Drift";
    case "diagram":
      return "Diagram correspondence";
    case "terraform":
      return "Terraform mapping";
    case "audit":
      return "Audit lineage";
    default:
      return "Hub";
  }
}
