using ArchLucid.Application.Governance;

namespace ArchLucid.Application.Runs.Orchestration.Commit;

/// <summary>
///     Pre-commit governance gate evaluation for the authority commit path.
/// </summary>
public interface IAuthorityCommitGovernanceStage
{
    /// <summary>
    ///     Evaluates the pre-commit governance gate and throws <see cref="PreCommitGovernanceBlockedException" />
    ///     when blocked without a valid bypass justification.
    /// </summary>
    Task EvaluateOrThrowAsync(
        string runId,
        string actor,
        string goldenManifestWireJson,
        string? governanceBypassJustification,
        PreCommitGovernancePreloadedData? preloadedData,
        CancellationToken cancellationToken);
}
