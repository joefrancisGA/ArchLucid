import type {
  PatchTechnologyLedgerEntryRequest,
  PatchTechnologyLedgerEntryResponse,
  TechnologyLedgerListResponse,
} from "@/types/technology-ledger";

import { apiGet, apiPatchJson } from "./http";

const ledgerBase = (runId: string): string =>
  `/v1/runs/${encodeURIComponent(runId)}/technology-ledger`;

export async function getTechnologyLedger(runId: string): Promise<TechnologyLedgerListResponse> {
  return apiGet<TechnologyLedgerListResponse>(ledgerBase(runId));
}

export async function patchTechnologyLedgerEntry(
  runId: string,
  entryId: string,
  body: PatchTechnologyLedgerEntryRequest,
): Promise<PatchTechnologyLedgerEntryResponse> {
  return apiPatchJson<PatchTechnologyLedgerEntryResponse>(
    `${ledgerBase(runId)}/${encodeURIComponent(entryId)}`,
    body,
  );
}
