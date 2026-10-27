namespace ArchLucid.Application.Exports;

/// <summary>Omission copy for run summary one-pager markdown exports.</summary>
internal static class RunSummaryOnePagerHonestyCopy
{
    internal const string SystemNameNotStored = "System name was not stored.";

    internal const string RunIdNotStored = "Review ID was not stored.";

    internal const string FindingsSnapshotIdNotStored = "Findings snapshot id was not stored.";

    internal const string SealedFindingCountNotStored = "Sealed finding count was not stored.";

    internal const string MutedFindingsExcludedFromCounts =
        "Muted findings are excluded from these counts.";

    internal const string TopFindingTitlesNotStored = "Top finding titles were not stored.";

    internal const string AgentFindingsNotStored = "Agent findings were not stored.";

    internal static string ResolveSystemName(string? systemName) =>
        string.IsNullOrWhiteSpace(systemName) ? SystemNameNotStored : systemName.Trim();

    internal static string ResolveRunId(string? runId) =>
        string.IsNullOrWhiteSpace(runId) ? RunIdNotStored : runId.Trim();

    internal static string FormatSealedFindingsSection(
        bool hasSealedSnapshot,
        string? findingsSnapshotId,
        int sealedFindingCount)
    {
        if (!hasSealedSnapshot)
        {
            return "No sealed findings snapshot on this run yet — deterministic engines have not produced a sealed record.";
        }

        string snapshotLabel = string.IsNullOrWhiteSpace(findingsSnapshotId)
            ? FindingsSnapshotIdNotStored
            : findingsSnapshotId.Trim();

        if (sealedFindingCount < 0)
        {
            return $"Sealed snapshot `{snapshotLabel}` — {SealedFindingCountNotStored}";
        }

        return $"Sealed snapshot `{snapshotLabel}` — {sealedFindingCount} finding(s) on the authority pipeline stream. Finalize gate, ITSM `FindingId`, and golden corpus use this record.";
    }
}
