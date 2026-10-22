import type { components } from "@/lib/openapi-schemas";

export type TechnologyLedgerRole = components["schemas"]["TechnologyLedgerRole"];

export type TechnologyLedgerStatus = components["schemas"]["TechnologyLedgerStatus"];

export type TechnologyLedgerSource = components["schemas"]["TechnologyLedgerSource"];

/** OpenAPI `CloudProvider` — retained export name for UI call sites. */
export type CloudProviderFamily = components["schemas"]["CloudProvider"];

type TechnologyLedgerEntryResponseSchema = components["schemas"]["TechnologyLedgerEntryResponse"];

export type TechnologyLedgerEntry = TechnologyLedgerEntryResponseSchema &
  Required<
    Pick<
      TechnologyLedgerEntryResponseSchema,
      | "entryId"
      | "runId"
      | "role"
      | "technologyName"
      | "providerFamily"
      | "status"
      | "source"
      | "evidenceRef"
      | "rationale"
      | "isLocked"
      | "createdUtc"
      | "updatedUtc"
    >
  > & {
    providerFamily: CloudProviderFamily;
  };

type TechnologyLedgerListResponseSchema = components["schemas"]["TechnologyLedgerListResponse"];

export type TechnologyLedgerListResponse = TechnologyLedgerListResponseSchema &
  Required<Pick<TechnologyLedgerListResponseSchema, "runId" | "entries">> & {
    entries: TechnologyLedgerEntry[];
  };

export type PatchTechnologyLedgerEntryRequest = components["schemas"]["PatchTechnologyLedgerEntryRequest"];

type PatchTechnologyLedgerEntryResponseSchema = components["schemas"]["PatchTechnologyLedgerEntryResponse"];

export type PatchTechnologyLedgerEntryResponse = PatchTechnologyLedgerEntryResponseSchema & {
  entry: TechnologyLedgerEntry;
};
