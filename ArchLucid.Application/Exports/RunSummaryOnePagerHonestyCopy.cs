namespace ArchLucid.Application.Exports;

/// <summary>Omission copy for run summary one-pager markdown exports.</summary>
internal static class RunSummaryOnePagerHonestyCopy
{
    internal const string SystemNameNotStored = "System name was not stored.";

    internal const string SystemNameStoredEmpty = "System name was stored empty.";

    internal const string RunIdNotStored = "Review ID was not stored.";

    internal const string RunIdStoredEmpty = "Review ID was stored empty.";

    internal const string FindingsSnapshotIdNotStored = "Findings snapshot id was not stored.";

    internal const string FindingsSnapshotIdStoredEmpty = "Findings snapshot id was stored empty.";

    internal const string SealedFindingCountNotStored = "Sealed finding count was not stored.";

    internal const string MutedFindingsExcludedFromCounts =
        "Muted findings are excluded from these counts.";

    internal const string TopFindingTitlesNotStored = "Top finding titles were not stored.";

    internal const string NoCriticalOrErrorFindingTitles =
        "No Critical or Error finding titles were stored for this list.";

    internal const string TopHighCriticalRemainderLine =
        "more Critical or Error finding(s) were not listed in this top-findings cap.";

    internal const string FindingTitleStoredEmpty = "Finding title was stored empty.";

    internal const string AgentFindingsNotStored = "Agent findings were not stored.";

    internal const string SponsorReportNotStored = "Sponsor report was not stored.";

    internal static string ResolveSystemName(string? systemName)
    {
        if (systemName is null)
        {
            return SystemNameNotStored;
        }

        if (systemName.Length == 0 || string.IsNullOrWhiteSpace(systemName))
        {
            return SystemNameStoredEmpty;
        }

        return systemName.Trim();
    }

    internal static string ResolveRunId(string? runId)
    {
        if (runId is null)
        {
            return RunIdNotStored;
        }

        if (runId.Length == 0 || string.IsNullOrWhiteSpace(runId))
        {
            return RunIdStoredEmpty;
        }

        return runId.Trim();
    }

    internal static string FormatSealedFindingsSection(Guid? findingsSnapshotId, int sealedFindingCount)
    {
        if (findingsSnapshotId is null)
        {
            return FindingsSnapshotIdNotStored;
        }

        if (findingsSnapshotId == Guid.Empty)
        {
            return FindingsSnapshotIdStoredEmpty;
        }

        string snapshotLabel = findingsSnapshotId.Value.ToString("D");

        if (sealedFindingCount < 0)
        {
            return $"Sealed snapshot `{snapshotLabel}` — {SealedFindingCountNotStored}";
        }

        return
            $"Sealed snapshot `{snapshotLabel}` — {sealedFindingCount} finding(s) on the authority pipeline stream. Finalize gate, ITSM `FindingId`, and golden corpus use this record.";
    }

    internal static string ResolveTopFindingsEmptyCopy(bool agentFindingsStored, int nonBlankTitleCount)
    {
        if (!agentFindingsStored)
        {
            return string.Empty;
        }

        return nonBlankTitleCount == 0
            ? NoCriticalOrErrorFindingTitles
            : string.Empty;
    }
}
