import type {
  PatchTechnologyLedgerEntryRequest,
  PatchTechnologyLedgerEntryResponse,
  TechnologyLedgerListResponse,
} from "@/types/technology-ledger";

import { formatExportSealedManifestAwareApiError } from "@/lib/api/export-sealed-manifest-conflict";
import { technologyLedgerBlockedReason } from "@/lib/runs/technology-ledger-blocked-reason";
import { technologyLedgerMutationBlockedReason } from "@/lib/runs/technology-ledger-mutation-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";

import { encodeRequiredPathSegment, trimTextFields } from "./api-boundary-normalization";
import { apiGetSealedManifestAware } from "./api-get-sealed-manifest-aware";
import { apiPatchJson } from "./http";

/** Builds the ledger path. A blank run id throws before any request is sent. */
const ledgerBase = (runId: string): string =>
  `/v1/runs/${encodeRequiredPathSegment(runId, "runId")}/technology-ledger`;

export async function getTechnologyLedger(runId: string): Promise<TechnologyLedgerListResponse> {
  const path = ledgerBase(runId);

  try {
    return await apiGetSealedManifestAware<TechnologyLedgerListResponse>(path);
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
  const path = `${ledgerBase(runId)}/${encodeRequiredPathSegment(entryId, "entryId")}`;
  const normalizedBody = trimTextFields(body, ["rationale", "technologyName"]);

  try {
    return await apiPatchJson<PatchTechnologyLedgerEntryResponse>(path, normalizedBody);
  } catch (error: unknown) {
    const failure = toApiLoadFailure(error);
    const blockedReason = technologyLedgerMutationBlockedReason(failure);

    throw new Error(blockedReason ?? formatExportSealedManifestAwareApiError(failure));
  }
}
