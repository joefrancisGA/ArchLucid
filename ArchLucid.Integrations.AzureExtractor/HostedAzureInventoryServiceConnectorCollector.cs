using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects Service Connector linkers for hosted Tier 2 packages (AX-DE-17).
/// </summary>
public static class HostedAzureInventoryServiceConnectorCollector
{
    private const string ServiceLinkerApiVersion = "2022-11-01-preview";

    private const string ServiceLinkerChildCollection = "providers/Microsoft.ServiceLinker/linkers";

    public static async Task<HostedAzureInventoryServiceConnectorCollectResult> CollectAsync(
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

        List<AzureInventoryServiceConnectorLinkRow> rows = [];
        List<string> collectionWarnings = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (!IsServiceConnectorParentResourceType(resource.ResourceType)
                || string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            try
            {
                HostedAzureArmChildCollectionReadResult listResult = await armReadClient.ListChildJsonElementsAsync(
                    accessToken,
                    resource.ResourceId.Trim(),
                    ServiceLinkerChildCollection,
                    ServiceLinkerApiVersion,
                    "Service Connector linker",
                    cancellationToken).ConfigureAwait(false);

                HostedAzureInventoryChildListPartialEnumeration.NotePartialCollection(
                    logger,
                    listResult,
                    resource.ResourceId.Trim(),
                    "Service Connector linker",
                    collectionWarnings,
                    AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration);

                AddLinkers(resource.ResourceId.Trim(), listResult.Values, rows, seenKeys);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor skipped Service Connector linkers for parent {ParentId}.",
                        resource.ResourceId);
                }
            }
        }

        return new HostedAzureInventoryServiceConnectorCollectResult
        {
            Links = rows,
            CollectionWarnings = collectionWarnings,
        };
    }

    private static bool IsServiceConnectorParentResourceType(string resourceType)
    {
        return resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
               || resourceType.Equals("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase);
    }

    private static void AddLinkers(
        string sourceResourceId,
        IReadOnlyList<JsonElement> linkers,
        List<AzureInventoryServiceConnectorLinkRow> rows,
        HashSet<string> seenKeys)
    {
        foreach (JsonElement linker in linkers)
        {
            if (!AzureInventoryServiceConnectorLinkExtractor.TryExtract(sourceResourceId, linker, out AzureInventoryServiceConnectorLinkRow? row)
                || row is null)
            {
                continue;
            }

            string key = $"{row.SourceResourceId}|{row.LinkerName}|{row.LinkerResourceId}|{row.TargetResourceId}";

            if (seenKeys.Add(key))
            {
                rows.Add(row);
            }
        }
    }
}
