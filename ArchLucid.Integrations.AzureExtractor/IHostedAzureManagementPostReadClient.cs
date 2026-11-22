namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Read-only management.azure.com POST surfaces for hosted Tier 2 collection
///     (Cost Management query, Policy Insights policy states, and NIC effective network controls).
/// </summary>
public interface IHostedAzureManagementPostReadClient
{
    /// <summary>
    ///     POST-read NIC effective NSG and route table evidence (IE-RF-10). Fail-soft per control kind.
    /// </summary>
    Task<IReadOnlyList<HostedAzureArmEffectiveNetworkControlRecord>> ListEffectiveNetworkControlsForNicAsync(
        string accessToken,
        string nicResourceId,
        CancellationToken cancellationToken);

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

    Task<HostedAzureAksRunCommandResult> RunAksWorkloadImageCommandAsync(
        string accessToken,
        string clusterResourceId,
        CancellationToken cancellationToken);
}
