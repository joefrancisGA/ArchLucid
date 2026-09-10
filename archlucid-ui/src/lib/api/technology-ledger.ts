import type {
  PatchTechnologyLedgerEntryRequest,
  PatchTechnologyLedgerEntryResponse,
  TechnologyLedgerListResponse,
} from "@/types/technology-ledger";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { technologyLedgerMutationBlockedReason } from "@/lib/runs/technology-ledger-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiPatchJson } from "./http";

const ledgerBase = (runId: string): string =>
  `/v1/runs/${encodeURIComponent(runId)}/technology-ledger`;

export async function getTechnologyLedger(runId: string): Promise<TechnologyLedgerListResponse> {
  try {
    return await apiGetSealedManifestAware<TechnologyLedgerListResponse>(ledgerBase(runId));
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = technologyLedgerBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}

export async function patchTechnologyLedgerEntry(
  runId: string,
  entryId: string,
  body: PatchTechnologyLedgerEntryRequest,
): Promise<PatchTechnologyLedgerEntryResponse> {
  try {
    return await apiPatchJson<PatchTechnologyLedgerEntryResponse>(
      `${ledgerBase(runId)}/${encodeURIComponent(entryId)}`,
      body,
    );
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = technologyLedgerMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
