using System.ComponentModel.DataAnnotations;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Serialization;

namespace ArchLucid.Contracts.Manifest;

/// <summary>
///     A resolved service node in a <see cref="GoldenManifest" />, representing one deployable
///     service component in the target architecture.
/// </summary>
public sealed class ManifestService
{
    /// <summary>Unique service identifier used for relationship references within this manifest.</summary>
    [Required]
    public string ServiceId
    {
        get;
        set;
    } = Guid.NewGuid().ToString("N");

    /// <summary>Human-readable service name (e.g. <c>OrderService</c>, <c>Azure App Service</c>).</summary>
    [Required]
    public string ServiceName
    {
        get;
        set;
    } = string.Empty;

    /// <summary>Functional category of this service (API, UI, Worker, etc.).</summary>
    [Required]
    public ServiceType ServiceType
    {
        get;
        set;
    }

    /// <summary>Deployment platform for this service (e.g. <c>AppService</c>, <c>ContainerApps</c>).</summary>
    [Required]
    public RuntimePlatform RuntimePlatform
    {
        get;
        set;
    }

    /// <summary>Short description of the service's role in the architecture. Optional.</summary>
    public string? Purpose
    {
        get;
        set;
    }

    /// <summary>
    ///     Optional Azure <c>armRegionName</c> so CLI / artifacts can probe public Retail hourly meters (<c>azureArmRegion</c> JSON).
    /// </summary>
    public string? AzureArmRegion
    {
        get;

        set;
    }

    /// <summary>Optional Azure SKU/tier hint aligned with Retail <c>skuName</c>.</summary>
    public string? AzurePricingSku
    {
        get;

        set;
    }

    /// <summary>Multiplies hourly-derived totals (bounded to minimum 1).</summary>
    public int InstanceCount
    {
        get;

        set;
    } = 1;

    /// <summary>Governance and security controls required for this specific service.</summary>
    private List<string> tags = [];

    public List<string> Tags
    {
        get => tags;
        set => tags = ContractCollectionDefaults.Coalesce(value);
    }

    /// <summary>Governance and security controls required for this specific service.</summary>
    private List<string> requiredControls = [];

    public List<string> RequiredControls
    {
        get => requiredControls;
        set => requiredControls = ContractCollectionDefaults.Coalesce(value);
    }
}
