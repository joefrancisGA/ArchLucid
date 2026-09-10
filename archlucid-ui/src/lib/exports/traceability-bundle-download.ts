import { getTraceabilityBundleDownloadUrl } from "@/lib/api/downloads-blob-urls";
import type { ErrorRecoveryContractPresentation } from "@/lib/error-recovery-contract-copy";
import {
  exportVerifyBlockedRecovery,
  traceabilityBundleTooLargeRecovery,
} from "@/lib/exports/export-verify-recovery-copy";
import {
  findFirstNonAttestedRunExportLineage,
  isRunExportLineageAttested,
  verifyRunExportLineage,
  type RunExportLineageVerificationResult,
} from "@/lib/exports/run-export-lineage-verify";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

export type TraceabilityBundleDownloadResult =
  | { readonly ok: true; readonly verifyResult?: RunExportLineageVerificationResult }
  | { readonly ok: false; readonly recovery: ErrorRecoveryContractPresentation };

function triggerBlobDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Working-gated traceability ZIP download with export verify + TooLarge recovery (DR-10). */
export async function downloadTraceabilityBundleWithWorkingGate(options: {
  readonly runId: string;
  readonly workingDesk: boolean;
  readonly skipVerify?: boolean;
}): Promise<TraceabilityBundleDownloadResult> {
  const runId = options.runId.trim();

  if (runId.length === 0) {
    return {
      ok: false,
      recovery: {
        whatFailed: "Review id is missing for the evidence bundle download.",
        whatIsIntact: "Other review actions are unaffected.",
        nextStep: "Reload the review page and retry.",
      },
    };
  }

  if (options.workingDesk === true && options.skipVerify !== true) {
    const verifyResult = await verifyRunExportLineage(runId);

    if (!isRunExportLineageAttested(verifyResult)) {
      return { ok: false, recovery: exportVerifyBlockedRecovery(verifyResult) };
    }
  }

  const response = await fetch(
    getTraceabilityBundleDownloadUrl(runId),
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/zip" } }),
  );

  if (response.status === 413) {
    return { ok: false, recovery: traceabilityBundleTooLargeRecovery() };
  }

  if (!response.ok) {
    const text = await response.text();

    return {
      ok: false,
      recovery: {
        whatFailed: text.length > 0 ? text : `Evidence bundle download failed (HTTP ${response.status}).`,
        whatIsIntact: "The review record on the server is unchanged.",
        nextStep: "Retry the download or use a narrower export from Artifacts.",
      },
    };
  }

  const blob = await response.blob();
  triggerBlobDownload(blob, `traceability-${runId}.zip`);

  return { ok: true };
}

/** Verifies every run in a portfolio board-pack rollup before download (Working). */
export async function verifyBoardPackRunLineage(
  runIds: readonly string[],
  options: { readonly workingDesk: boolean; readonly skipVerify?: boolean },
): Promise<TraceabilityBundleDownloadResult> {
  if (options.workingDesk !== true || options.skipVerify === true) {
    return { ok: true };
  }

  const ids = runIds.map((id) => id.trim()).filter((id) => id.length > 0);

  if (ids.length === 0) {
    return { ok: true };
  }

  const blocked = await findFirstNonAttestedRunExportLineage(ids);

  if (blocked !== null) {
    return { ok: false, recovery: exportVerifyBlockedRecovery(blocked) };
  }

  return { ok: true };
}
