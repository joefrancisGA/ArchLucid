using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     Shared run-repository rules used by SQL and in-memory <see cref="IRunRepository" /> implementations.
/// </summary>
internal static partial class RunRepositoryCore
{
    public const int MaxPurgeBatchSize = 10_000;

    public static void ValidateRunKeysetCursor(DateTime? cursorCreatedUtc, Guid? cursorRunId)
    {
        if (cursorCreatedUtc.HasValue != cursorRunId.HasValue)
            throw new ArgumentException(
                "Run keyset cursor requires both CreatedUtc and RunId together, or both omitted for the first page.");
    }

    public static string RequireArchitectureRequestId(string architectureRequestId)
    {
        if (string.IsNullOrWhiteSpace(architectureRequestId))
            throw new ArgumentException("Architecture request id is required.", nameof(architectureRequestId));

        return architectureRequestId.Trim();
    }

    public static string RequireSystemName(string systemName)
    {
        if (string.IsNullOrWhiteSpace(systemName))
            throw new ArgumentException("System name is required.", nameof(systemName));

        return systemName.Trim();
    }

    public static void ValidateOperatorGovernanceDispositionArgs(Guid runId, string decision, string actorUserId)
    {
        if (runId == Guid.Empty)
            throw new ArgumentException("Run id is required.", nameof(runId));

        if (string.IsNullOrWhiteSpace(decision))
            throw new ArgumentException("Decision is required.", nameof(decision));

        if (string.IsNullOrWhiteSpace(actorUserId))
            throw new ArgumentException("Actor user id is required.", nameof(actorUserId));
    }

    public static int ClampPurgeBatchSize(int batchSize)
    {
        if (batchSize < 1)
            throw new ArgumentOutOfRangeException(nameof(batchSize), batchSize, "Batch size must be at least 1.");

        return Math.Clamp(batchSize, 1, MaxPurgeBatchSize);
    }

    public static bool ShouldConsumeTrialRunAllowanceOnCreate(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return TrialRunQuota.ShouldConsumeAllowanceOnCreate(
            run.IsSample,
            run.IsDemoWelcomeRun,
            run.ArchitectureRequestId);
    }

    public static ArchivedRunScopeRow ToArchivedRunScopeRow(RunRecord run)
    {
        ArgumentNullException.ThrowIfNull(run);

        return new ArchivedRunScopeRow
        {
            RunId = run.RunId,
            TenantId = run.TenantId,
            WorkspaceId = run.WorkspaceId,
            ScopeProjectId = run.ScopeProjectId,
        };
    }

    public static bool IsEligibleForCreatedBeforeArchive(RunRecord run, DateTime cutoffUtc, ScopeContext? scope) =>
        !run.ArchivedUtc.HasValue
        && run.CreatedUtc < cutoffUtc
        && (scope is null || MatchesScope(run, scope));

    public static bool IsEligibleForStaleUncommittedPurge(RunRecord run, DateTime cutoffUtc) =>
        run.CreatedUtc < cutoffUtc
        && !run.IsDemoWelcomeRun
        && !run.IsPublicShowcase
        && (string.IsNullOrWhiteSpace(run.LegacyRunStatus)
            || !string.Equals(
                run.LegacyRunStatus,
                nameof(ArchitectureRunStatus.Committed),
                StringComparison.OrdinalIgnoreCase));

    public static bool IsEligibleForSamplePurge(RunRecord run, Guid? tenantId, DateTime? cutoffUtc) =>
        run.IsSample
        && (!tenantId.HasValue || run.TenantId == tenantId.Value)
        && (!cutoffUtc.HasValue || run.CreatedUtc < cutoffUtc.Value);
}
