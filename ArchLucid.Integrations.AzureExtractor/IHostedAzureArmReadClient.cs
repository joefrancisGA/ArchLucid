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

    Task<IReadOnlyList<HostedAzureArmFederatedCredentialRecord>> ListFederatedCredentialsAsync(
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        CancellationToken cancellationToken);
}
