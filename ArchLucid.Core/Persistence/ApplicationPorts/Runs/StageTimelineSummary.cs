namespace ArchLucid.Core.Persistence.ApplicationPorts.Runs;

/// <summary>One authority pipeline stage row for operator run detail timeline (TB-250).</summary>
public sealed record StageTimelineSummary(
    string StageName,
    DateTime StartedUtc,
    DateTime? CompletedUtc,
    string OutcomeStatus,
    long? DurationMs)
{
    /// <summary>Computes elapsed milliseconds when <paramref name="completedUtc" /> is set; otherwise null.</summary>
    public static long? ComputeDurationMs(DateTime startedUtc, DateTime? completedUtc)
    {
        if (completedUtc is null)
            return null;

        double milliseconds = (completedUtc.Value - startedUtc).TotalMilliseconds;

        if (milliseconds < 0)
            return 0;

        return (long)Math.Round(milliseconds, MidpointRounding.AwayFromZero);
    }

    /// <summary>Maps a persisted row to the API/UI summary with derived duration.</summary>
    public static StageTimelineSummary FromRow(
        string stageName,
        DateTime startedUtc,
        DateTime? completedUtc,
        string outcomeStatus)
    {
        return new StageTimelineSummary(
            stageName,
            startedUtc,
            completedUtc,
            outcomeStatus,
            ComputeDurationMs(startedUtc, completedUtc));
    }
}
