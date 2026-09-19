namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Read-only management.azure.com POST surfaces for hosted Tier 2 collection
///     (Cost Management query and Policy Insights policy states).
/// </summary>
public interface IHostedAzureManagementPostReadClient
{
    Task<HostedAzureActualCostSummary?> TryQueryActualCostSummaryAsync(
        string accessToken,
        string subscriptionId,
        CancellationToken cancellationToken);

    Task<HostedAzurePolicyComplianceDocument> QueryPolicyComplianceAsync(
        string accessToken,
        string subscriptionId,
        string scopeDescriptor,
        string collectionTimestampUtc,
        CancellationToken cancellationToken);
}
