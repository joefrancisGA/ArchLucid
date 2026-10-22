using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects redacted App Service / Function app-setting host rows via config list (DCH-04).
/// </summary>
public static class HostedAzureInventoryWebAppAppSettingHostCollector
{
    private static readonly string[] ConfigListRelativePaths =
    [
        "config/appsettings/list",
        "config/connectionstrings/list",
    ];

    public static async Task<HostedAzureInventoryWebAppAppSettingHostCollectResult> CollectAsync(
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
            if (!resource.ResourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
                || string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            string siteResourceId = resource.ResourceId.Trim();
            bool forbiddenOnSite = false;

            foreach (string listPath in ConfigListRelativePaths)
            {
                try
                {
                    HostedAzureAppServiceConfigListResult listResult =
                        await armReadClient.TryListAppServiceConfigPropertiesAsync(
                            accessToken,
                            siteResourceId,
                            listPath,
                            cancellationToken).ConfigureAwait(false);

                    if (listResult.Status == HostedAzureAppServiceConfigListStatus.Forbidden)
                    {
                        forbiddenOnSite = true;

                        continue;
                    }

                    if (listResult.Status is not HostedAzureAppServiceConfigListStatus.Succeeded)
                    {
                        continue;
                    }

                    foreach (KeyValuePair<string, string> setting in listResult.Properties)
                    {
                        AzureInventoryAppSettingHostRowAppender.AppendParsedRows(
                            siteResourceId,
                            setting.Key,
                            setting.Value,
                            secretRef: null,
                            rows,
                            seenKeys);
                    }
                }
                catch (Exception ex) when (ex is not OperationCanceledException)
                {
                    if (logger.IsEnabled(LogLevel.Debug))
                    {
                        logger.LogDebug(
                            ex,
                            "Hosted Azure extractor skipped app service config list {ListPath} for {SiteResourceId}.",
                            listPath,
                            siteResourceId);
                    }
                }
            }

            if (forbiddenOnSite)
            {
                warnings.Add(
                    $"{AzureInventoryRelationshipCompletenessWarningCodes.AppSettingsListForbiddenPrefix}{siteResourceId}");
            }
        }

        return new HostedAzureInventoryWebAppAppSettingHostCollectResult
        {
            AppSettingHosts = rows,
            CollectionWarnings = warnings,
        };
    }
}
