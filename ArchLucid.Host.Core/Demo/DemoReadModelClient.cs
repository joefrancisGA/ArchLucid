using ArchLucid.AgentRuntime.Explanation;
using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Provenance;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Host.Core.Demo;

/// <summary>
/// Default <see cref="IDemoReadModelClient"/>. Resolves the latest committed demo-seed run from
/// <see cref="IRunRepository"/> (canonical baseline first, then a bounded scan over recent runs filtered
/// by <see cref="ContosoRetailDemoIdentifiers.IsDemoRequestId"/>), then composes the explanation summary
/// and provenance graph for that run by calling the same application services the
/// <c>/v1/explain</c> and <c>/v1/provenance</c> controllers use — but always under the demo scope.
/// </summary>
public sealed class DemoReadModelClient(
    IRunRepository runRepository,
    IRunExplanationSummaryService runExplanationSummary,
    IProvenanceQueryService provenanceQuery,
    TimeProvider timeProvider,
    ILogger<DemoReadModelClient> logger) : IDemoReadModelClient
{
    /// <summary>
    /// Cap on the recent-run scan so a host with thousands of demo runs cannot turn the gated demo
    /// route into an unbounded query. 100 is well above the canonical seed surface (2 runs) and the
    /// per-tenant multi-catalog seed surface (≤ 4 runs).
    /// </summary>
    private const int RecentRunScanLimit = 100;

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));
    private readonly IRunExplanationSummaryService _runExplanationSummary =
        runExplanationSummary ?? throw new ArgumentNullException(nameof(runExplanationSummary));
    private readonly IProvenanceQueryService _provenanceQuery =
        provenanceQuery ?? throw new ArgumentNullException(nameof(provenanceQuery));
    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
    private readonly ILogger<DemoReadModelClient> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    /// <inheritdoc />
    public async Task<DemoExplainResponse?> GetLatestCommittedDemoExplainAsync(CancellationToken cancellationToken = default)
    {
        ScopeContext scope = BuildDemoScope();

        RunRecord? run = await ResolveLatestCommittedDemoRunAsync(scope, cancellationToken);
        if (run is null)
        {
            _logger.LogInformation(
                "Demo explain: no committed demo-seed run found in scope {TenantId}; returning null.",
                scope.TenantId);

            return null;
        }

        RunExplanationSummary? explanation =
            await _runExplanationSummary.GetSummaryAsync(scope, run.RunId, cancellationToken);

        if (explanation is null)
        {
            _logger.LogWarning(
                "Demo explain: run {RunId} has no aggregate explanation summary in scope {TenantId}; returning null.",
                run.RunId,
                scope.TenantId);

            return null;
        }

        GraphViewModel graph = await _provenanceQuery.GetFullGraphAsync(scope, run.RunId, cancellationToken)
            ?? new GraphViewModel();

        return new DemoExplainResponse
        {
            GeneratedUtc = _timeProvider.GetUtcNow(),
            RunId = run.RunId.ToString("N"),
            ManifestVersion = run.CurrentManifestVersion,
            IsDemoData = true,
            RunExplanation = explanation,
            ProvenanceGraph = graph,
        };
    }

    /// <summary>
    /// Hard-pins the demo scope to the well-known development defaults — the same scope the
    /// <see cref="DemoSeedService"/> writes into. Production hosts cannot reach this code path
    /// because the route is gated on <c>Demo:Enabled=true</c>.
    /// </summary>
    private static ScopeContext BuildDemoScope() => new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject,
    };

    /// <summary>
    /// Strategy: try the canonical baseline run id first (deterministic — the trusted-baseline seed
    /// always inserts it). If it is missing or not committed, scan the most recent runs in scope and
    /// pick the newest one whose <see cref="RunRecord.ArchitectureRequestId"/> matches a demo request
    /// id (covers the multi-tenant <c>req-contoso-demo-{suffix}</c> shape produced by
    /// <see cref="ContosoRetailDemoIds.ForTenant"/>) and that already has a committed manifest.
    /// </summary>
    private async Task<RunRecord?> ResolveLatestCommittedDemoRunAsync(ScopeContext scope, CancellationToken cancellationToken)
    {
        RunRecord? canonical = await _runRepository.GetByIdAsync(
            scope,
            ContosoRetailDemoIdentifiers.AuthorityRunBaselineId,
            cancellationToken);

        if (IsCommittedDemoRun(canonical))
            return canonical;

        IReadOnlyList<RunRecord> recent =
            await _runRepository.ListRecentInScopeAsync(scope, RecentRunScanLimit, cancellationToken);

        return recent
            .Where(r => IsCommittedDemoRun(r))
            .OrderByDescending(r => r.CreatedUtc)
            .FirstOrDefault();
    }

    /// <summary>
    /// A "committed demo run" is a run whose <see cref="RunRecord.ArchitectureRequestId"/> matches one
    /// of the demo request shapes <em>and</em> already has a non-empty <see cref="RunRecord.GoldenManifestId"/>.
    /// </summary>
    private static bool IsCommittedDemoRun(RunRecord? run)
    {
        if (run is null) return false;
        if (!ContosoRetailDemoIdentifiers.IsDemoRequestId(run.ArchitectureRequestId)) return false;

        return run.GoldenManifestId is not null && run.GoldenManifestId.Value != Guid.Empty;
    }
}
