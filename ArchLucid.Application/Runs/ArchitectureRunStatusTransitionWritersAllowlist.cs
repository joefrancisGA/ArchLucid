namespace ArchLucid.Application.Runs;

/// <summary>
///     Production writers of <c>RunRecord.LegacyRunStatus</c> not yet routed through
///     <see cref="ArchLucid.Core.Runs.ArchitectureRunStatusTransitionTable" />.
///     Remove entries as call sites adopt <see cref="ArchitectureRunStatusLifecycleEvent" />.
/// </summary>
public static class ArchitectureRunStatusTransitionWritersAllowlist
{
    public static IReadOnlyList<ArchitectureRunStatusWriterAllowlistEntry> Entries { get; } =
        [
            new(
                "ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.PreExecute.cs",
                "ExecuteMarksWaitingForResults"),
            new(
                "ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.AgentLoop.cs",
                "ExecuteCompletesToReadyForCommit | ExecuteCompletesToPartiallyCompleted"),
            new(
                "ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.FailureSummary.cs",
                "ExecuteFailsToFailed | ExecuteFailsToFailedPartial"),
            new(
                "ArchLucid.Application/Runs/Orchestration/ArchitectureRunExecuteOrchestrator.QualityGate.cs",
                "QualityGateRejectsOutput"),
            new(
                "ArchLucid.Host.Core/Hosted/AuthorityPipelineWorkProcessor.cs",
                "TasksMaterialized"),
            new(
                "ArchLucid.Application/Runs/Orchestration/ArchitectureRunCreateOrchestrator.cs",
                "CoordinationPatchToCreated | CoordinationPatchToTasksGenerated"),
            new(
                "ArchLucid.Application/Runs/Coordination/ArchitectureRunAuthorityCoordination.cs",
                "CoordinationPatchToCreated | CoordinationPatchToTasksGenerated"),
            new(
                "ArchLucid.Application/Runs/ExecuteOwnership/RunExecuteOwnershipReconciliationService.cs",
                "OwnershipLeaseExpiredReconcileToFailed | OwnershipLeaseExpiredReconcileToFailedPartial"),
            new(
                "ArchLucid.Persistence/Sql/RunRepositorySql.cs",
                "CommitFinalized (SQL CAS)"),
            new(
                "ArchLucid.Application/Bootstrap/DemoSeedService.*.cs",
                "Bootstrap seed — not customer lifecycle"),
        ];
}

/// <summary>Documents a direct LegacyRunStatus writer until it routes through the transition table.</summary>
public readonly record struct ArchitectureRunStatusWriterAllowlistEntry(string RelativePath, string DocumentedEvents);
