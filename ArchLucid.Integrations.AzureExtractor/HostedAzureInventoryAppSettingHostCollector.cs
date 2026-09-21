using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects redacted Container App env host rows for hosted Tier 2 packages (SN-RT-01).
/// </summary>
public static class HostedAzureInventoryAppSettingHostCollector
{
    public static async Task<HostedAzureInventoryAppSettingHostCollectResult> CollectAsync(
        GetOnlyHostedAzureArmReadClient armReadClient,
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<AzureInventoryAppSettingHostRow> rows = [];
        List<string> warnings = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!resource.ResourceType.Equals("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            try
            {
                JsonElement? resourceJson = await armReadClient.TryGetArmResourceJsonAsync(
                    accessToken,
                    resource.ResourceId.Trim(),
                    AzureInventoryContainerAppEnvHostExtractor.ContainerAppsApiVersionValue,
                    cancellationToken).ConfigureAwait(false);

                if (resourceJson is null
                    || !AzureInventoryContainerAppEnvHostExtractor.HasTemplateEnvEntries(resourceJson.Value))
                {
                    warnings.Add(
                        AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsHostsContainerAppsEnvMissing);

                    continue;
                }

                IReadOnlyList<AzureInventoryAppSettingHostRow> extractedRows =
                    AzureInventoryContainerAppEnvHostExtractor.ExtractRows(
                        resource.ResourceId.Trim(),
                        resourceJson.Value);

                foreach (AzureInventoryAppSettingHostRow row in extractedRows)
                {
                    string key =
                        $"{row.SiteResourceId}|{row.SettingName}|{row.Host}|{row.KeyVaultHost}|{row.SecretName}|{row.Catalog}|{row.SecretRef}";

                    if (seenKeys.Add(key))
                    {
                        rows.Add(row);
                    }
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                warnings.Add(
                    AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsHostsContainerAppsEnvMissing);

                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor skipped Container App env hosts for {ContainerAppId}.",
                        resource.ResourceId);
                }
            }
        }

        return new HostedAzureInventoryAppSettingHostCollectResult
        {
            AppSettingHosts = rows,
            CollectionWarnings = warnings,
        };
    }
}

/// <summary>
///     Container App app-setting host collection output for hosted diagram enrichment (SN-RT-01).
/// </summary>
public sealed class HostedAzureInventoryAppSettingHostCollectResult
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
