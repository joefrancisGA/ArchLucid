namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Outcome of POST <c>config/appsettings/list</c> or <c>config/connectionstrings/list</c> (DCH-04).
/// </summary>
public sealed class HostedAzureAppServiceConfigListResult
{
    public HostedAzureAppServiceConfigListStatus Status
    {
        get;
        init;
    }

    public IReadOnlyDictionary<string, string> Properties
    {
        get;
        init;
    } = new Dictionary<string, string>();

    public static HostedAzureAppServiceConfigListResult Forbidden()
    {
        return new HostedAzureAppServiceConfigListResult
        {
            Status = HostedAzureAppServiceConfigListStatus.Forbidden,
        };
    }

    public static HostedAzureAppServiceConfigListResult NotFound()
    {
        return new HostedAzureAppServiceConfigListResult
        {
            Status = HostedAzureAppServiceConfigListStatus.NotFound,
        };
    }

    public static HostedAzureAppServiceConfigListResult Failed()
    {
        return new HostedAzureAppServiceConfigListResult
        {
            Status = HostedAzureAppServiceConfigListStatus.Failed,
        };
    }

    public static HostedAzureAppServiceConfigListResult Succeeded(IReadOnlyDictionary<string, string> properties)
    {
        return new HostedAzureAppServiceConfigListResult
        {
            Status = HostedAzureAppServiceConfigListStatus.Succeeded,
            Properties = properties,
        };
    }
}
