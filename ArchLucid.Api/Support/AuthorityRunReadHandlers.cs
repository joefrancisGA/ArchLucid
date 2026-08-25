using ArchLucid.Api.Contracts;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Common;
using ArchLucid.Application.Explanation;
using ArchLucid.Application.Provenance;
using ArchLucid.Application.Runs;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.DevTesting;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;
using ArchLucid.Provenance.Analysis;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Api.Support;

/// <summary>
///     Shared run/manifest/review-trail read handlers for <see cref="Controllers.Authority.AuthorityReadsController" />
///     and legacy <see cref="Controllers.Authority.AuthorityQueryController" /> aliases.
/// </summary>
public sealed class AuthorityRunReadHandlers(
    IAuthorityQueryService queryService,
    IAuthorityRunDetailOperatorEnricher runDetailOperatorEnricher,
    IRunRationaleService runRationaleService,
    IRunPipelineAuditTimelineService pipelineAuditTimeline,
    IScopeContextProvider scopeProvider,
    IProvenanceGraphAccessService provenanceGraphAccess,
    IAuditService auditService,
    IActorContext actorContext,
    IEffectiveAgentExecutionModeAccessor effectiveAgentExecutionModeAccessor,
    ILogger<AuthorityRunReadHandlers> logger)
{
    private readonly IEffectiveAgentExecutionModeAccessor _effectiveAgentExecutionModeAccessor =
        effectiveAgentExecutionModeAccessor ?? throw new ArgumentNullException(nameof(effectiveAgentExecutionModeAccessor));

    private readonly ILogger<AuthorityRunReadHandlers> _logger =
        logger ?? throw new ArgumentNullException(nameof(logger));

    public async Task<RunDetailDto?> GetRunDetailAsync(Guid runId, CancellationToken ct)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? result = await queryService.GetRunDetailAsync(scope, runId, ct);

        if (result is null)
            return null;

        result.ExecutionFlavorBuyerSummary = RunExecutionFlavorSummary.Build(
            result.Run.RealModeFellBackToSimulator,
            _effectiveAgentExecutionModeAccessor.GetEffectiveMode());

        await runDetailOperatorEnricher
            .EnrichAsync(result, _effectiveAgentExecutionModeAccessor.GetEffectiveMode(), ct)
            .ConfigureAwait(false);

        int findingCount = result.FindingsSnapshot?.Findings?.Count ?? 0;
        FindingsListAccessTelemetry.LogFindingSnapshotExpose(_logger, scope, runId, nameof(GetRunDetailAsync), findingCount);

        return result;
    }

    public async Task<IReadOnlyList<RunPipelineTimelineItemResponse>?> TryGetPipelineTimelineAsync(
        Guid runId,
        CancellationToken ct)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        IReadOnlyList<RunPipelineTimelineItemDto>? items =
            await pipelineAuditTimeline.GetTimelineAsync(scope, runId, ct);

        if (items is null)
            return null;

        return items
            .Select(i => new RunPipelineTimelineItemResponse
            {
                EventId = i.EventId,
                OccurredUtc = i.OccurredUtc,
                EventType = i.EventType,
                ActorUserName = i.ActorUserName,
                CorrelationId = i.CorrelationId
            })
            .ToList();
    }

    public Task<RunRationale?> GetRunRationaleAsync(Guid runId, CancellationToken ct)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        return runRationaleService.GetRunRationaleAsync(scope, runId, ct);
    }

    public async Task<(DecisionProvenanceGraph? Graph, RunDetailDto? Detail, string? UnprocessableDetail)> TryGetProvenanceGraphAsync(
        Guid runId,
        CancellationToken ct)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await queryService.GetRunDetailAsync(scope, runId, ct);

        if (detail is null)
            return (null, null, null);

        if (detail.GoldenManifest is null ||
            detail.GraphSnapshot is null ||
            detail.FindingsSnapshot is null ||
            detail.AuthorityTrace is null)
        {
            return (
                null,
                detail,
                "Provenance requires golden manifest, graph snapshot, findings snapshot, and authority decision trace. " +
                "Coordinator-only or in-progress runs do not satisfy this contract.");
        }

        DecisionProvenanceGraph? graph = await provenanceGraphAccess.ResolveGraphAsync(scope, detail, ct);

        if (graph is null)
            return (null, detail, "Provenance graph could not be resolved for this run.");

        int provenanceFindingCount = detail.FindingsSnapshot.Findings?.Count ?? 0;
        FindingsListAccessTelemetry.LogFindingSnapshotExpose(
            _logger,
            scope,
            runId,
            nameof(TryGetProvenanceGraphAsync),
            provenanceFindingCount);

        ProvenanceCompletenessResult completeness = ProvenanceCompletenessAnalyzer.Analyze(graph);

        ArchLucidInstrumentation.ProvenanceCompleteness.Record(
            completeness.CoverageRatio,
            new KeyValuePair<string, object?>("surface", "authority_query"));

        return (graph, detail, null);
    }

    public async Task<(IReadOnlyList<RunSummaryDto> Items, bool HasMore)> ListRunsInScopeKeysetAsync(
        DateTime? createdUtc,
        Guid? runId,
        int take,
        CancellationToken ct)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        return await queryService.ListRunsInScopeKeysetAsync(scope, createdUtc, runId, take, ct);
    }

    public Task LogRunScopedAuditAsync(string eventType, Guid runId, Guid? manifestId, CancellationToken ct)
    {
        string actor = actorContext.GetActor();
        ScopeContext scope = scopeProvider.GetCurrentScope();

        return auditService.LogAsync(
            new AuditEvent
            {
                EventType = eventType,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runId,
                ManifestId = manifestId
            },
            ct);
    }

    public static RunSummaryResponse ToRunSummaryResponse(RunSummaryDto x) =>
        new()
        {
            RunId = x.RunId,
            ProjectId = x.ProjectId,
            Description = x.Description,
            DisplayName = string.IsNullOrWhiteSpace(x.Description) ? null : x.Description.Trim(),
            IsDemoWelcomeRun = x.IsDemoWelcomeRun,
            IsSample = x.IsSample,
            IsPinned = x.IsPinned,
            CreatedUtc = x.CreatedUtc,
            HasContextSnapshot = x.HasContextSnapshot,
            HasGraphSnapshot = x.HasGraphSnapshot,
            HasFindingsSnapshot = x.HasFindingsSnapshot,
            HasGoldenManifest = x.HasGoldenManifest,
            GoldenManifestId = x.GoldenManifestId,
            HasDecisionTrace = x.HasDecisionTrace,
            HasArtifactBundle = x.HasArtifactBundle,
            HasWarnings = x.HasWarnings,
            HasGovernanceWarnings = x.HasGovernanceWarnings,
            RunDegradedExecution = x.RunDegradedExecution,
            DegradedExecutionAgents = x.DegradedExecutionAgents,
            PackageOrigin = x.PackageOrigin,
            StructuralExecutionMode = x.StructuralExecutionMode,
        };
}
