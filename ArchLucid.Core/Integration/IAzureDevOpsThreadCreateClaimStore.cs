namespace ArchLucid.Core.Integration;

/// <summary>
/// Atomically reserves an Azure DevOps PR thread creation before sending it.
/// A granted claim must not be released or expired for automated replay because the remote outcome may be unknown.
/// </summary>
public interface IAzureDevOpsThreadCreateClaimStore
{
    /// <summary>Returns true only to the caller that first records this claim.</summary>
    Task<bool> TryClaimAsync(AzureDevOpsThreadCreateClaim claim, CancellationToken cancellationToken);
}

/// <summary>The stable identity of a server-side Azure DevOps PR thread creation.</summary>
public readonly record struct AzureDevOpsThreadCreateClaim(
    Guid TenantId,
    Guid RunId,
    Guid RepositoryId,
    int PullRequestId);
