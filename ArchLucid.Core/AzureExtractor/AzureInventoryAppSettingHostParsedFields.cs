namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Redacted host/catalog fields parsed from an app setting or Container App env value (SN-RT-02).
/// </summary>
public sealed class AzureInventoryAppSettingHostParsedFields
{
    public string? Host
    {
        get;
        init;
    }

    public string? Catalog
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

    public string? WarningCode
    {
        get;
        init;
    }

    public bool HasAnyField =>
        !string.IsNullOrWhiteSpace(Host)
        || !string.IsNullOrWhiteSpace(Catalog)
        || !string.IsNullOrWhiteSpace(KeyVaultHost)
        || !string.IsNullOrWhiteSpace(SecretName);
}
