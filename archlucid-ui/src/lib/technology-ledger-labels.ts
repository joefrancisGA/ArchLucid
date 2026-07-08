import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type {
  CloudProviderFamily,
  TechnologyLedgerRole,
  TechnologyLedgerSource,
  TechnologyLedgerStatus,
} from "@/types/technology-ledger";

export function technologyLedgerRoleLabel(role: TechnologyLedgerRole): string {
  switch (role) {
    case "CloudPlatform":
      return "Cloud platform";
    case "IdentityProvider":
      return "Identity";
    case "PrimaryDatastore":
      return "Primary datastore";
    case "Messaging":
      return "Messaging";
    case "ComputeRuntime":
      return "Compute runtime";
    case "Region":
      return "Region";
    case "IacTarget":
      return "IaC target";
    case "Other":
      return "Other";
    default: {
      const exhaustive: never = role;
      return exhaustive;
    }
  }
}

export function technologyLedgerProviderLabel(provider: CloudProviderFamily): string {
  switch (provider) {
    case "None":
      return "Cloud-neutral";
    case "Azure":
      return "Azure";
    case "Aws":
      return "AWS";
    case "Gcp":
      return "GCP";
    default: {
      const exhaustive: never = provider;
      return exhaustive;
    }
  }
}

export function technologyLedgerStatusLabel(status: TechnologyLedgerStatus): string {
  switch (status) {
    case "Chosen":
      return "Chosen";
    case "Assumed":
      return "Assumed";
    case "Alternative":
      return "Alternative";
    case "Future":
      return "Future";
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function technologyLedgerStatusTag(status: TechnologyLedgerStatus): {
  kind: EnterpriseStatusKind;
  label: string;
} {
  switch (status) {
    case "Chosen":
      return { kind: "ready", label: technologyLedgerStatusLabel(status) };
    case "Assumed":
      return { kind: "needs-attention", label: technologyLedgerStatusLabel(status) };
    case "Alternative":
    case "Future":
      return { kind: "draft", label: technologyLedgerStatusLabel(status) };
    default: {
      const exhaustive: never = status;
      return exhaustive;
    }
  }
}

export function technologyLedgerSourceLabel(source: TechnologyLedgerSource): string {
  switch (source) {
    case "User":
      return "Intake";
    case "Evidence":
      return "Evidence";
    case "AgentProposed":
      return "Agent proposal";
    default: {
      const exhaustive: never = source;
      return exhaustive;
    }
  }
}
