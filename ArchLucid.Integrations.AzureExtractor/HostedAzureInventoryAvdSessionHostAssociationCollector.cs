using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects AVD session host to backing VM associations for hosted Tier 2 packages.
/// </summary>
public static class HostedAzureInventoryAvdSessionHostAssociationCollector
{
    private const string SessionHostsApiVersion = "2024-04-03";

    public static async Task<HostedAzureInventoryAvdSessionHostAssociationCollectResult> CollectAsync(
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

        List<HostedAzureArmNetworkAssociationRecord> rows = [];
        List<string> collectionWarnings = [];
        HashSet<string> seenKeys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (string.IsNullOrWhiteSpace(resource.ResourceId)
                || !resource.ResourceType.Equals(
                    "Microsoft.DesktopVirtualization/hostPools",
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            try
            {
                HostedAzureArmChildCollectionReadResult listResult = await armReadClient.ListChildJsonElementsAsync(
                    accessToken,
                    resource.ResourceId.Trim(),
                    "sessionHosts",
                    SessionHostsApiVersion,
                    "AVD session host",
                    cancellationToken).ConfigureAwait(false);

                HostedAzureInventoryChildListPartialEnumeration.NotePartialCollection(
                    logger,
                    listResult,
                    resource.ResourceId.Trim(),
                    "AVD session host",
                    collectionWarnings,
                    AzureInventoryPaasChildCompletenessWarningCodes.PartialChildEnumeration);

                foreach (JsonElement sessionHost in listResult.Values)
                {
                    if (!AzureInventoryAvdSessionHostAssociationExtractor.TryExtractFromJsonElement(
                            sessionHost,
                            out AzureInventoryAvdSessionHostAssociationRow? association)
                        || association is null)
                    {
                        continue;
                    }

                    AddRow(association, rows, seenKeys);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                if (logger.IsEnabled(LogLevel.Debug))
                {
                    logger.LogDebug(
                        ex,
                        "Hosted Azure extractor skipped AVD session hosts for host pool {HostPoolId}.",
                        resource.ResourceId);
                }
            }
        }

        return new HostedAzureInventoryAvdSessionHostAssociationCollectResult
        {
            Associations = rows,
            CollectionWarnings = collectionWarnings,
        };
    }

    private static void AddRow(
        AzureInventoryAvdSessionHostAssociationRow association,
        List<HostedAzureArmNetworkAssociationRecord> rows,
        HashSet<string> seenKeys)
    {
        string key =
            $"{association.SessionHostResourceId}|{association.AssociationType}|{association.VirtualMachineResourceId}";

        if (!seenKeys.Add(key))
        {
            return;
        }

        rows.Add(new HostedAzureArmNetworkAssociationRecord(
            association.SessionHostResourceId,
            association.VirtualMachineResourceId,
            association.AssociationType));
    }
}
