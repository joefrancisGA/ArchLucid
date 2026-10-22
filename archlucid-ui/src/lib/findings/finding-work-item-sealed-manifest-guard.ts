/** Wave-25 suggestion 241: block clipboard copy when finding is not manifest-bound. */
export function findingWorkItemSealedManifestCopyBlockedReason(input: {
  runId: string;
  manifestVersion?: string | null;
}): string | null {
  const runId = input.runId.trim();

  if (runId.length === 0) {
    return "Copy blocked: finding run id is missing.";
  }

  const manifestVersion = input.manifestVersion?.trim() ?? "";

  if (manifestVersion.length === 0) {
    return "Copy blocked: finding is not bound to a committed sealed manifest version.";
  }

  return null;
}
