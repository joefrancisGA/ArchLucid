using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Models;
using ArchLucid.Persistence.Queries;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Default <see cref="ICompareRunsApplicationFacade"/> consolidating comparison route orchestration previously in
///     <c>ComparisonController</c> and <c>RunComparisonController</c>.
/// </summary>
public sealed class CompareRunsApplicationFacade(
    IAuthorityQueryService authorityQuery,
    IRunDetailQueryService runDetailQueryService,
    IComparisonService comparison,
    IAgentResultDiffService agentResultDiffService,
    IScopeContextProvider scopeProvider) : ICompareRunsApplicationFacade
{
    private readonly IAuthorityQueryService _authorityQuery =
        authorityQuery ?? throw new ArgumentNullException(nameof(authorityQuery));

    private readonly IRunDetailQueryService _runDetailQueryService =
        runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IComparisonService _comparison =
        comparison ?? throw new ArgumentNullException(nameof(comparison));

    private readonly IAgentResultDiffService _agentResultDiffService =
        agentResultDiffService ?? throw new ArgumentNullException(nameof(agentResultDiffService));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <inheritdoc />
    public async Task<ScopedRunPairLoadResult> LoadScopedRunPairAsync(
        string leftRunId,
        string rightRunId,
        CancellationToken ct)
    {
        Task<ArchitectureRunDetail?> leftDetailTask =
            _runDetailQueryService.GetRunDetailForRollupAsync(leftRunId, ct);
        Task<ArchitectureRunDetail?> rightDetailTask =
            _runDetailQueryService.GetRunDetailForRollupAsync(rightRunId, ct);
        await Task.WhenAll(leftDetailTask, rightDetailTask);

        ArchitectureRunDetail? left = await leftDetailTask;
        if (left is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.LeftRunNotFound,
                MissingRunId = leftRunId,
            };
        }

        ArchitectureRunDetail? right = await rightDetailTask;
        if (right is null)
        {
            return new ScopedRunPairLoadResult
            {
                Outcome = ScopedRunPairLoadOutcome.RightRunNotFound,
                MissingRunId = rightRunId,
            };
        }

        return new ScopedRunPairLoadResult
        {
            Outcome = ScopedRunPairLoadOutcome.Success,
            Left = left,
            Right = right,
        };
    }

    /// <inheritdoc />
    public async Task<ManifestCompareLoadResult> CompareManifestsAsync(
        Guid baseRunId,
        Guid targetRunId,
        CancellationToken ct)
    {
        ScopeContext scope = _scopeProvider.GetCurrentScope();
        Task<RunDetailDto?> baseRunTask = _authorityQuery.GetRunDetailForManifestCompareAsync(scope, baseRunId, ct);
        Task<RunDetailDto?> targetRunTask = _authorityQuery.GetRunDetailForManifestCompareAsync(scope, targetRunId, ct);
        await Task.WhenAll(baseRunTask, targetRunTask);

        RunDetailDto? baseRun = await baseRunTask;
        if (baseRun is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseRunNotFound,
                RunId = baseRunId,
            };
        }

        RunDetailDto? targetRun = await targetRunTask;
        if (targetRun is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetRunNotFound,
                RunId = targetRunId,
            };
        }

        if (baseRun.GoldenManifest is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.BaseManifestNotFound,
                RunId = baseRunId,
            };
        }

        if (targetRun.GoldenManifest is null)
        {
            return new ManifestCompareLoadResult
            {
                Outcome = ManifestCompareLoadOutcome.TargetManifestNotFound,
                RunId = targetRunId,
            };
        }

        ComparisonResult comparison = _comparison.Compare(baseRun.GoldenManifest, targetRun.GoldenManifest);
        return new ManifestCompareLoadResult
        {
            Outcome = ManifestCompareLoadOutcome.Success,
            Comparison = comparison,
        };
    }

    /// <inheritdoc />
    public AgentResultDiffResult CompareAgentResults(
        string leftRunId,
        ArchitectureRunDetail leftDetail,
        string rightRunId,
        ArchitectureRunDetail rightDetail) =>
        _agentResultDiffService.Compare(
            leftRunId,
            leftDetail.Results,
            rightRunId,
            rightDetail.Results);
}
