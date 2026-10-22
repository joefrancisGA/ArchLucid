namespace ArchLucid.Contracts.Abstractions.Integrations;

public sealed class HostedAzureExtractorCollectionRequest
{
    public required string CustomerTenantId { get; init; }

    public required string CustomerAppId { get; init; }

    /// <summary>Subscription scope. Mutually exclusive with <see cref="ManagementGroupId"/>.</summary>
    public string? SubscriptionId { get; init; }

    /// <summary>Management group scope. Mutually exclusive with <see cref="SubscriptionId"/>.</summary>
    public string? ManagementGroupId { get; init; }

    public bool IncludeCost { get; init; }

    /// <summary>
    ///     When true, POST App Service <c>config/appsettings/list</c> and <c>config/connectionstrings/list</c> for hostname hints only (DCH-04).
    /// </summary>
    public bool IncludeAppSettingsHosts { get; init; }
}
