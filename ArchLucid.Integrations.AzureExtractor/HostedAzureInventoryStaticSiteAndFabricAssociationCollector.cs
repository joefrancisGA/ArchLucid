using System.Text.Json;

using ArchLucid.Core.AzureExtractor;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Collects NR-40 / NR-42 network-association rows for hosted packages.
/// </summary>
public static class HostedAzureInventoryStaticSiteAndFabricAssociationCollector
{
    private const string StaticSiteApiVersion = "2023-12-01";
    private const string FabricCapacityApiVersion = "2024-05-01";

    public static async Task<HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult> CollectAsync(
        IHostedAzureArmReadClient armReadClient,
        string accessToken,
        IReadOnlyList<HostedAzureArmResourceRecord> resources,
        ILogger logger,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(armReadClient);
        ArgumentException.ThrowIfNullOrWhiteSpace(accessToken);
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(logger);

        List<HostedAzureArmNetworkAssociationRecord> associations = [];
        List<string> warnings = [];
        HashSet<string> keys = new(StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord resource in resources)
        {
            if (string.IsNullOrWhiteSpace(resource.ResourceId))
            {
                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.Web/staticSites", StringComparison.OrdinalIgnoreCase))
            {
                await CollectStaticSiteBackendsAsync(
                    armReadClient,
                    accessToken,
                    resource,
                    associations,
                    warnings,
                    keys,
                    cancellationToken).ConfigureAwait(false);

                continue;
            }

            if (resource.ResourceType.Equals("Microsoft.Fabric/capacities", StringComparison.OrdinalIgnoreCase))
            {
                await CollectFabricWorkspacesAsync(
                    armReadClient,
                    accessToken,
                    resource,
                    associations,
                    warnings,
                    keys,
                    cancellationToken).ConfigureAwait(false);
            }
        }

        return new HostedAzureInventoryStaticSiteAndFabricAssociationCollectResult
        {
            Associations = associations,
            CollectionWarnings = warnings,
        };
    }

    private static async Task CollectStaticSiteBackendsAsync(
        IHostedAzureArmReadClient armReadClient,
        string accessToken,
        HostedAzureArmResourceRecord staticSite,
        List<HostedAzureArmNetworkAssociationRecord> associations,
        List<string> warnings,
        HashSet<string> keys,
        CancellationToken cancellationToken)
    {
        HostedAzureArmChildCollectionReadResult listResult = await armReadClient
            .ListChildResourcesWithStatusAsync(
                accessToken,
                staticSite.ResourceId,
                "linkedBackends",
                StaticSiteApiVersion,
                cancellationToken)
            .ConfigureAwait(false);

        if (listResult.StatusCode is 401 or 403)
        {
            warnings.Add(
                AzureInventoryStaticSiteCollectionWarnings.Format(
                    AzureInventoryStaticSiteCollectionWarnings.ReasonInsufficientPermission,
                    staticSite.ResourceId));

            return;
        }

        if (listResult.StatusCode < 200 || listResult.StatusCode >= 300)
        {
            if (listResult.StatusCode > 0)
            {
                warnings.Add(
                    AzureInventoryStaticSiteCollectionWarnings.Format(
                        AzureInventoryStaticSiteCollectionWarnings.MapHttpStatusToReason(listResult.StatusCode),
                        staticSite.ResourceId));
            }

            return;
        }

        if (listResult.PartialCollection)
        {
            warnings.Add(
                AzureInventoryStaticSiteCollectionWarnings.Format(
                    AzureInventoryStaticSiteCollectionWarnings.ReasonPartialEnumeration,
                    staticSite.ResourceId));
        }

        foreach (JsonElement backend in listResult.Values)
        {
            string? backendResourceId = AzureInventoryStaticSiteLinkedBackendParser.TryReadBackendResourceId(backend);

            if (string.IsNullOrWhiteSpace(backendResourceId))
            {
                continue;
            }

            AddAssociation(
                associations,
                keys,
                staticSite.ResourceId,
                backendResourceId,
                AzureInventoryRelationshipAssociationTypes.StaticSiteToLinkedBackend);
        }
    }

    private static async Task CollectFabricWorkspacesAsync(
        IHostedAzureArmReadClient armReadClient,
        string accessToken,
        HostedAzureArmResourceRecord capacity,
        List<HostedAzureArmNetworkAssociationRecord> associations,
        List<string> warnings,
        HashSet<string> keys,
        CancellationToken cancellationToken)
    {
        HostedAzureArmChildCollectionReadResult listResult = await armReadClient
            .ListChildResourcesWithStatusAsync(
                accessToken,
                capacity.ResourceId,
                "workspaces",
                FabricCapacityApiVersion,
                cancellationToken)
            .ConfigureAwait(false);

        if (listResult.StatusCode is 401 or 403)
        {
            warnings.Add(
                AzureInventoryFabricCapacityCollectionWarnings.FormatAssignmentsNotCollected(
                    AzureInventoryFabricCapacityCollectionWarnings.ReasonInsufficientPermission,
                    capacity.ResourceId));

            return;
        }

        if (listResult.StatusCode < 200 || listResult.StatusCode >= 300)
        {
            if (listResult.StatusCode > 0)
            {
                warnings.Add(
                    AzureInventoryFabricCapacityCollectionWarnings.FormatAssignmentsNotCollected(
                        AzureInventoryFabricCapacityCollectionWarnings.ReasonHttpError,
                        capacity.ResourceId));
            }

            return;
        }

        if (listResult.PartialCollection)
        {
            warnings.Add(
                AzureInventoryFabricCapacityCollectionWarnings.FormatAssignmentsNotCollected(
                    AzureInventoryFabricCapacityCollectionWarnings.ReasonPartialEnumeration,
                    capacity.ResourceId));
        }

        int outsideInventoryCount = 0;

        foreach (JsonElement workspace in listResult.Values)
        {
            if (!AzureInventoryFabricCapacityWorkspaceParser.TryReadWorkspaceAssignment(
                    workspace,
                    out string? workspaceResourceId,
                    out _))
            {
                outsideInventoryCount++;

                continue;
            }

            AddAssociation(
                associations,
                keys,
                capacity.ResourceId,
                workspaceResourceId!,
                AzureInventoryRelationshipAssociationTypes.FabricCapacityToWorkspace);
        }

        if (outsideInventoryCount > 0)
        {
            warnings.Add(
                AzureInventoryFabricCapacityCollectionWarnings.FormatWorkspacesOutsideInventory(
                    outsideInventoryCount,
                    capacity.ResourceId));
        }
    }

    private static void AddAssociation(
        List<HostedAzureArmNetworkAssociationRecord> associations,
        HashSet<string> keys,
        string fromResourceId,
        string toResourceId,
        string associationType)
    {
        string key = $"{fromResourceId}|{associationType}|{toResourceId}";

        if (!keys.Add(key))
        {
            return;
        }

        associations.Add(
            new HostedAzureArmNetworkAssociationRecord(fromResourceId, toResourceId, associationType));
    }
}
