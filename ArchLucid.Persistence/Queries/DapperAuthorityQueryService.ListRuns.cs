using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Queries;

public sealed partial class DapperAuthorityQueryService
{
    /// <inheritdoc />
    public async Task<IReadOnlyList<RunSummaryDto>> ListRunsByProjectAsync(
        ScopeContext scope,
        string projectId,
        int take,
        CancellationToken ct)
    {
        IReadOnlyList<RunRecord> runs = await runRepository.ListByProjectAsync(scope, projectId, take, ct);
        List<RunSummaryDto> summaries = runs.Select(AuthorityRunMapper.MapSummary).ToList();
        await RunExecutionDegradation.PopulateSummariesAsync(scope, summaries, runs, _agentExecutionTraceRepository, ct);

        return summaries;
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<RunSummaryDto> Items, bool HasMore)> ListRunsByProjectKeysetAsync(
        ScopeContext scope,
        string projectId,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        RunListPage page = await runRepository.ListByProjectKeysetAsync(
            scope,
            projectId,
            cursorCreatedUtc,
            cursorRunId,
            take,
            ct);

        List<RunSummaryDto> summaries = page.Items.Select(AuthorityRunMapper.MapSummary).ToList();
        await RunExecutionDegradation.PopulateSummariesAsync(scope, summaries, page.Items, _agentExecutionTraceRepository, ct);

        return (summaries, page.HasMore);
    }

    /// <inheritdoc />
    public async Task<(IReadOnlyList<RunSummaryDto> Items, bool HasMore)> ListRunsInScopeKeysetAsync(
        ScopeContext scope,
        DateTime? cursorCreatedUtc,
        Guid? cursorRunId,
        int take,
        CancellationToken ct)
    {
        RunListPage page = await runRepository.ListRecentInScopeKeysetAsync(
            scope,
            cursorCreatedUtc,
            cursorRunId,
            take,
            ct);

        List<RunSummaryDto> summaries = page.Items.Select(AuthorityRunMapper.MapSummary).ToList();
        await RunExecutionDegradation.PopulateSummariesAsync(scope, summaries, page.Items, _agentExecutionTraceRepository, ct);

        return (summaries, page.HasMore);
    }

    /// <inheritdoc />
    public Task<Guid?> GetLatestCommittedRunIdByManifestCreatedUtcAsync(
        ScopeContext scope,
        string projectId,
        CancellationToken ct)
        => runRepository.GetLatestCommittedRunIdByManifestCreatedUtcAsync(scope, projectId, ct);

    /// <inheritdoc />
    public async Task<RunSummaryDto?> GetPriorCommittedRunSummaryBeforeCurrentAsync(
        ScopeContext scope,
        Guid currentRunId,
        string projectId,
        DateTime currentCreatedUtc,
        CancellationToken ct)
    {
        RunRecord? currentRun = await runRepository.GetByIdAsync(scope, currentRunId, ct).ConfigureAwait(false);

        if (currentRun?.ArchitectureId is Guid architectureId)
        {
            if (_architectureIdentityRepository is not null)
            {
                ArchitectureIdentityRecord? identity = await _architectureIdentityRepository
                    .GetByIdAsync(scope, architectureId, ct)
                    .ConfigureAwait(false);

                if (identity?.LatestSealedManifestId is Guid sealedManifestId)
                {
                    Guid? sealedRunId = await runRepository
                        .GetCommittedRunIdByGoldenManifestIdAsync(
                            scope,
                            architectureId,
                            sealedManifestId,
                            currentRunId,
                            ct)
                        .ConfigureAwait(false);

                    if (sealedRunId is not null)
                        return await GetRunSummaryAsync(scope, sealedRunId.Value, ct).ConfigureAwait(false);
                }
            }

            Guid? architecturePriorRunId = await runRepository
                .GetPriorCommittedRunIdForArchitectureBeforeCurrentAsync(
                    scope,
                    architectureId,
                    currentRunId,
                    currentCreatedUtc,
                    ct)
                .ConfigureAwait(false);

            if (architecturePriorRunId is not null)
                return await GetRunSummaryAsync(scope, architecturePriorRunId.Value, ct).ConfigureAwait(false);
        }

        Guid? priorRunId = await runRepository.GetPriorCommittedRunIdBeforeCurrentAsync(
            scope,
            projectId,
            currentRunId,
            currentCreatedUtc,
            ct);

        if (priorRunId is null)
            return null;

        return await GetRunSummaryAsync(scope, priorRunId.Value, ct);
    }

    /// <inheritdoc />
    public async Task<RunSummaryDto?> GetRunSummaryAsync(ScopeContext scope, Guid runId, CancellationToken ct)
    {
        RunRecord? run = await runRepository.GetByIdAsync(scope, runId, ct);

        if (run is null)
            return null;

        RunSummaryDto summary = AuthorityRunMapper.MapSummary(run);
        IReadOnlyList<string> agents = await _agentExecutionTraceRepository.GetDistinctAgentTypesWithLlmResourceFallbackAsync(
            scope,
            run.RunId.ToString("N"),
            ct);
        RunExecutionDegradation.Apply(summary, run, agents);

        return summary;
    }
}
