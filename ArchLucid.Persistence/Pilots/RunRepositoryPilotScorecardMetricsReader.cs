using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Pilots;

/// <summary>
///     In-memory scorecard aggregates from <see cref="IRunRepository"/> (ambient scope), so finalized
///     reviews in the active workspace populate <c>GET /v1/pilots/scorecard</c> instead of the zero stub.
/// </summary>
public sealed class RunRepositoryPilotScorecardMetricsReader(
    IRunRepository runRepository,
    IScopeContextProvider scopeContextProvider) : IPilotScorecardMetricsReader
{
    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<PilotScorecardTenantMetrics> GetAsync(Guid tenantId, CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();

        // Scorecard service always passes the ambient tenant; prefer ambient workspace/project so
        // metrics align with Reviews (ListRecentInScopeAsync) rather than a hard-coded zero stub.
        if (scope.TenantId != tenantId)
        {
            scope = new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
            };
        }

        IReadOnlyList<RunRecord> recent =
            await _runRepository.ListRecentInScopeAsync(scope, take: 10_000, cancellationToken);

        List<RunRecord> committed =
        [
            .. recent.Where(static r =>
                !string.IsNullOrWhiteSpace(r.CurrentManifestVersion)
                || (r.GoldenManifestId is not null && r.GoldenManifestId.Value != Guid.Empty)),
        ];

        int manifestsCreated = committed.Count(static r =>
            r.GoldenManifestId is not null && r.GoldenManifestId.Value != Guid.Empty);

        DateTimeOffset? firstCommitUtc = committed.Count == 0
            ? null
            : committed.Min(static r =>
                new DateTimeOffset(DateTime.SpecifyKind(r.CreatedUtc, DateTimeKind.Utc)));

        double? averageMinutes = null;

        List<double> cycleMinutes =
        [
            .. committed
                .Where(static r => r.CompletedUtc is not null && r.CompletedUtc.Value >= r.CreatedUtc)
                .Select(static r => (r.CompletedUtc!.Value - r.CreatedUtc).TotalMinutes),
        ];

        if (cycleMinutes.Count > 0)
        {
            averageMinutes = cycleMinutes.Average();
        }

        return new PilotScorecardTenantMetrics
        {
            TotalRunsCommitted = committed.Count,
            TotalManifestsCreated = manifestsCreated,
            TotalFindingsResolved = 0,
            AverageTimeToManifestMinutes = averageMinutes,
            TotalAuditEventsGenerated = 0,
            TotalGovernanceApprovalsCompleted = 0,
            FirstCommitUtc = firstCommitUtc,
        };
    }
}
