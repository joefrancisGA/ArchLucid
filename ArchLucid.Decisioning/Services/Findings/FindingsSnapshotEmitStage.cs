using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Findings;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Services.Findings;

public sealed partial class FindingsSnapshotEmitStage(ILogger<FindingsSnapshotEmitStage> logger)
    : IFindingsSnapshotEmitStage
{
    private readonly ILogger<FindingsSnapshotEmitStage> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public Task<FindingsSnapshot> ExecuteAsync(FindingsStageContext context, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(context);

        if (context.Snapshot is null)
            throw new InvalidOperationException("Findings snapshot was not built before emit stage.");

        FindingsSnapshot snapshot = context.Snapshot;

        ApplyHeldCheckLedger(context, snapshot);

        FindingsSnapshotMigrator.Apply(snapshot);

        snapshot.GenerationStatus = context.EngineFailures.Count switch
        {
            0 => FindingsSnapshotGenerationStatus.Complete,
            _ when context.DedupedFindingsCount > 0 => FindingsSnapshotGenerationStatus.PartiallyComplete,
            _ => FindingsSnapshotGenerationStatus.Failed,
        };

        if (context.EngineFailures.Count > 0 && context.SuccessfulEngineInvocations > 0)
        {
            ArchLucidInstrumentation.RecordFindingsEnginePartialFailure();
            LogPartialEngineFailures(context.RunId, context.EngineFailures.Count);
        }

        LogSnapshotBuilt(
            context.RunId,
            snapshot.FindingsSnapshotId,
            snapshot.Findings.Count,
            snapshot.SchemaVersion);

        return Task.FromResult(snapshot);
    }

    private static void ApplyHeldCheckLedger(FindingsStageContext context, FindingsSnapshot snapshot)
    {
        IReadOnlyList<HeldCheckLedgerRollupEntry>? rollup =
            context.AnalysisContext?.HeldCheckLedger?.BuildRollup();

        if (rollup is null || rollup.Count == 0)
        {
            return;
        }

        snapshot.InsightDensityCuration ??= new InsightDensityCurationSummary();
        snapshot.InsightDensityCuration.HeldCheckLedgerEntries = rollup.ToList();
    }

    [LoggerMessage(
        EventId = 3,
        Level = LogLevel.Information,
        Message =
            "Findings snapshot built: RunId={RunId} FindingsSnapshotId={SnapshotId} TotalFindings={Total} SchemaVersion={SchemaVersion}")]
    private partial void LogSnapshotBuilt(Guid runId, Guid snapshotId, int total, int schemaVersion);

    [LoggerMessage(
        EventId = 4,
        Level = LogLevel.Warning,
        Message = "Findings snapshot built with engine failures: RunId={RunId} FailedEngineCount={FailedEngineCount}")]
    private partial void LogPartialEngineFailures(Guid runId, int failedEngineCount);
}
