namespace ArchLucid.Contracts.Abstractions.Integrations;

/// <summary>
///     Posts Azure DevOps PR status updates when an architecture run commit succeeds or fails (Improvement #12).
/// </summary>
public interface IAzureDevOpsCommitStatusPublisher
{
    /// <summary>Best-effort PR status decoration for configured repository/PR when integration is enabled.</summary>
    Task PublishCommitOutcomeAsync(Guid runId, bool succeeded, CancellationToken cancellationToken);
}
