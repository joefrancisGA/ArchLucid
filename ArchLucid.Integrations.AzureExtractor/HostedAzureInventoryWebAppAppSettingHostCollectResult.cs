using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Web App app-setting host collection output for hosted diagram enrichment (DCH-04).
/// </summary>
public sealed class HostedAzureInventoryWebAppAppSettingHostCollectResult
{
    public IReadOnlyList<AzureInventoryAppSettingHostRow> AppSettingHosts
    {
        get;
        init;
    } = [];

    public IReadOnlyList<string> CollectionWarnings
    {
        get;
        init;
    } = [];
}
