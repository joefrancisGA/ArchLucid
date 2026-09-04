using ArchLucid.Application.Diffs;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Comparison;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Application workflow facade for run-to-run comparison HTTP routes: scoped run-pair loading,
///     golden-manifest compare, and agent-result compare.
/// </summary>
public interface ICompareRunsApplicationFacade
{
    Task<ScopedRunPairLoadResult> LoadScopedRunPairAsync(
        string leftRunId,
        string rightRunId,
        CancellationToken ct);

    Task<ManifestCompareLoadResult> CompareManifestsAsync(
        Guid baseRunId,
        Guid targetRunId,
        CancellationToken ct);

    Task<VersionManifestCompareLoadResult> CompareManifestVersionsAsync(
        string leftVersion,
        string rightVersion,
        CancellationToken ct);

    AgentResultDiffResult CompareAgentResults(
        string leftRunId,
        ArchitectureRunDetail leftDetail,
        string rightRunId,
        ArchitectureRunDetail rightDetail,
        CompareInputFingerprints? inputFingerprints = null);
}
