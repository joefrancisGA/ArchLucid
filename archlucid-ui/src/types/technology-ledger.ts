/** Technology Ledger DTOs — manual until OpenAPI snapshot includes Prompt 9 routes. */

export type TechnologyLedgerRole =
  | "CloudPlatform"
  | "IdentityProvider"
  | "PrimaryDatastore"
  | "Messaging"
  | "ComputeRuntime"
  | "Region"
  | "IacTarget"
  | "Other";

export type TechnologyLedgerStatus = "Chosen" | "Assumed" | "Alternative" | "Future";

export type TechnologyLedgerSource = "User" | "Evidence" | "AgentProposed";

export type CloudProviderFamily = "None" | "Azure" | "Aws" | "Gcp";

export type TechnologyLedgerEntry = {
  readonly entryId: string;
  readonly runId: string;
  readonly role: TechnologyLedgerRole;
  readonly technologyName: string;
  readonly providerFamily: CloudProviderFamily;
  readonly status: TechnologyLedgerStatus;
  readonly source: TechnologyLedgerSource;
  readonly evidenceRef: string | null;
  readonly rationale: string | null;
  readonly isLocked: boolean;
  readonly createdUtc: string;
  readonly updatedUtc: string;
};

export type TechnologyLedgerListResponse = {
  readonly runId: string;
  readonly entries: TechnologyLedgerEntry[];
};

export type PatchTechnologyLedgerEntryRequest = {
  readonly status?: TechnologyLedgerStatus;
  readonly isLocked?: boolean;
  readonly rationale?: string;
  readonly technologyName?: string;
  readonly providerFamily?: CloudProviderFamily;
};

export type PatchTechnologyLedgerEntryResponse = {
  readonly entry: TechnologyLedgerEntry;
};
