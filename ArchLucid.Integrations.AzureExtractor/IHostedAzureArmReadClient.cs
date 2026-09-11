namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Read-only ARM inventory collector for hosted extractor (GET <c>management.azure.com</c> only).
/// </summary>
public interface IHostedAzureArmReadClient
{
    Task<IReadOnlyList<HostedAzureArmResourceRecord>> ListSubscriptionResourcesAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<HostedAzureArmRoleAssignmentRecord>> ListSubscriptionRoleAssignmentsAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken);

    /// <summary>
    ///     GET <c>/subscriptions/{id}</c> for ARM <c>displayName</c>. Returns null when the name is missing, a GUID, or the call fails.
    /// </summary>
    Task<string?> TryGetSubscriptionDisplayNameAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken);
}
