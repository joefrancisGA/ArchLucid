using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Runs.Orchestration;

/// <summary>
/// Selects the legacy coordinator merge path vs the authority <see cref="Decisioning.Interfaces.IDecisionEngine"/>
/// path based on <see cref="LegacyRunCommitPathOptions.LegacyRunCommitPath"/>.
/// </summary>
public sealed class RunCommitPathSelector(
    IOptions<LegacyRunCommitPathOptions> options,
    ArchitectureRunCommitOrchestrator legacy,
    AuthorityDrivenArchitectureRunCommitOrchestrator authority) : IArchitectureRunCommitOrchestrator
{
    private readonly IOptions<LegacyRunCommitPathOptions> _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly ArchitectureRunCommitOrchestrator _legacy = legacy ?? throw new ArgumentNullException(nameof(legacy));

    private readonly AuthorityDrivenArchitectureRunCommitOrchestrator _authority =
        authority ?? throw new ArgumentNullException(nameof(authority));

    /// <inheritdoc />
    public Task<CommitRunResult> CommitRunAsync(string runId, CancellationToken cancellationToken = default)
    {
        if (_options.Value.LegacyRunCommitPath)
            return _legacy.CommitRunAsync(runId, cancellationToken);

        return _authority.CommitRunAsync(runId, cancellationToken);
    }
}
