using ArchLucid.Application.Diffs;
using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Application.Analysis;

public sealed partial class CompareRunsApplicationFacade
{
    /// <inheritdoc />
    public async Task<AgentResultDiffResult> CompareAgentResultsAsync(
        string leftRunId,
        ArchitectureRunDetail leftDetail,
        string rightRunId,
        ArchitectureRunDetail rightDetail,
        CompareInputFingerprints? inputFingerprints = null,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(leftDetail);
        ArgumentNullException.ThrowIfNull(rightDetail);

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        string leftCanonical = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(leftRunId);
        string rightCanonical = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(rightRunId);

        IReadOnlyList<AgentResult> leftResults = await AnalysisRunIdCanonicalization
            .ResolveAgentResultsForCompareReadAsync(
                _agentResultRepository,
                scope,
                leftDetail.Results,
                leftCanonical,
                useRollupProjection: true,
                cancellationToken)
            .ConfigureAwait(false);
        IReadOnlyList<AgentResult> rightResults = await AnalysisRunIdCanonicalization
            .ResolveAgentResultsForCompareReadAsync(
                _agentResultRepository,
                scope,
                rightDetail.Results,
                rightCanonical,
                useRollupProjection: true,
                cancellationToken)
            .ConfigureAwait(false);

        AgentResultDiffResult diff = _agentResultDiffService.Compare(
            leftCanonical,
            leftResults,
            rightCanonical,
            rightResults);
        diff.InputFingerprints = inputFingerprints;
        return diff;
    }
}
