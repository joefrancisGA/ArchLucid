namespace ArchLucid.Persistence.Archival;

/// <summary>
///     Retention-driven soft archival for authority runs, advisory digests, and Ask conversation threads.
/// </summary>
public sealed class DataArchivalOptions
{
    public const string SectionName = "DataArchival";

    /// <summary>When false, the hosted archival loop does nothing.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Archive runs with <c>CreatedUtc</c> older than this many days. 0 = skip runs.</summary>
    public int RunsRetentionDays
    {
        get;
        set;
    }

    /// <summary>Archive digests by <c>GeneratedUtc</c>. 0 = skip digests.</summary>
    public int DigestsRetentionDays
    {
        get;
        set;
    }

    /// <summary>Archive conversation threads by <c>LastUpdatedUtc</c>. 0 = skip threads.</summary>
    public int ConversationsRetentionDays
    {
        get;
        set;
    }

    /// <summary>Minimum wall-clock interval between archival passes.</summary>
    public int IntervalHours
    {
        get;
        set;
    } = 24;

    /// <summary>
    ///     When &gt; 0, hard-deletes <c>dbo.AgentExecutionTraces</c> rows whose <c>ArchivedUtc</c> is older than this many
    ///     days (SQL storage only — Cosmos uses TTL). 0 disables (default).
    /// </summary>
    public int PurgeArchivedAgentExecutionTracesAfterDays
    {
        get;
        set;
    }

    /// <summary>Rows per <c>DELETE TOP</c> batch when purging archived traces (clamped by the repository).</summary>
    public int PurgeArchivedAgentExecutionTracesBatchSize
    {
        get;
        set;
    } = 500;

    /// <summary>
    ///     When &gt; 0, hard-deletes non-committed <c>dbo.Runs</c> rows (and dependent authority data) with
    ///     <c>CreatedUtc</c> older than this many days via <c>dbo.Archival_PurgeStaleUncommittedRunsBatch</c>. 0 disables.
    /// </summary>
    public int PurgeUncommittedRunsAfterDays
    {
        get;
        set;
    }

    /// <summary>Rows per stored-procedure batch when <see cref="PurgeUncommittedRunsAfterDays"/> is enabled.</summary>
    public int PurgeUncommittedRunsBatchSize
    {
        get;
        set;
    } = 500;

    /// <summary>Orphaned agent-trace blob cleanup under the shared archival schedule.</summary>
    public DataArchivalBlobCleanupOptions BlobCleanup
    {
        get;
        set;
    } = new();
}
