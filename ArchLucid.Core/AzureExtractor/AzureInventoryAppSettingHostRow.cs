namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Redacted App Service / Function setting host metadata (AX-DE-18).
/// </summary>
public sealed class AzureInventoryAppSettingHostRow
{
    public string SiteResourceId
    {
        get;
        init;
    } = string.Empty;

    public string SettingName
    {
        get;
        init;
    } = string.Empty;

    public string? Host
    {
        get;
        init;
    }

    public string? KeyVaultHost
    {
        get;
        init;
    }

    public string? SecretName
    {
        get;
        init;
    }

    public string? Catalog
    {
        get;
        init;
    }

    public string? SecretRef
    {
        get;
        init;
    }

    public string CollectionStatus
    {
        get;
        init;
    } = AzureInventoryAdfLinkedServiceCollectionStatus.Succeeded;

    public string? WarningCode
    {
        get;
        init;
    }
}
