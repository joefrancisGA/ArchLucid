using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Resolves sanitized ADF linked-service targets against inventoried Azure resources.
/// </summary>
public static class AzureInventoryAdfLinkedServiceTargetResolver
{
    public static bool TryResolveTargetArmId(
        AzureInventoryAdfLinkedServiceRow row,
        IReadOnlyDictionary<string, string> visibleArmIdByNormalizedId,
        IReadOnlyDictionary<string, string> hostToArmId,
        out string? targetArmId,
        out ProvenanceKind provenanceKind,
        out string associationType)
    {
        ArgumentNullException.ThrowIfNull(row);
        ArgumentNullException.ThrowIfNull(visibleArmIdByNormalizedId);
        ArgumentNullException.ThrowIfNull(hostToArmId);

        targetArmId = null;
        provenanceKind = ProvenanceKind.ObservedFact;
        associationType = AzureInventoryPipelineStyleEdgeAssociationSelector.SelectLinkedServiceAssociationType(
            row.FactoryResourceId,
            inferred: false);

        if (!string.IsNullOrWhiteSpace(row.TargetResourceId)
            && visibleArmIdByNormalizedId.ContainsKey(Normalize(row.TargetResourceId)))
        {
            targetArmId = Normalize(row.TargetResourceId);

            return true;
        }

        if (!string.IsNullOrWhiteSpace(row.KeyVaultResourceId)
            && visibleArmIdByNormalizedId.ContainsKey(Normalize(row.KeyVaultResourceId)))
        {
            targetArmId = Normalize(row.KeyVaultResourceId);

            return true;
        }

        if (string.IsNullOrWhiteSpace(row.TargetHost))
        {
            return false;
        }

        if (!hostToArmId.TryGetValue(row.TargetHost.Trim().ToLowerInvariant(), out string? matchedArmId))
        {
            return false;
        }

        targetArmId = matchedArmId;
        provenanceKind = ProvenanceKind.DeterministicInference;
        associationType = AzureInventoryPipelineStyleEdgeAssociationSelector.SelectLinkedServiceAssociationType(
            row.FactoryResourceId,
            inferred: true);

        return true;
    }

    public static Dictionary<string, string> BuildHostIndex(IReadOnlyList<AzureExtractorExtendedResourceRow> resources)
    {
        ArgumentNullException.ThrowIfNull(resources);

        Dictionary<string, List<string>> candidatesByHost = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureExtractorExtendedResourceRow resource in resources)
        {
            foreach (string host in ExtractKnownHosts(resource))
            {
                if (!candidatesByHost.TryGetValue(host, out List<string>? candidates))
                {
                    candidates = [];
                    candidatesByHost[host] = candidates;
                }

                candidates.Add(Normalize(resource.AzureResourceId));
            }
        }

        Dictionary<string, string> uniqueHosts = new(StringComparer.OrdinalIgnoreCase);

        foreach (KeyValuePair<string, List<string>> entry in candidatesByHost)
        {
            List<string> distinct = entry.Value.Distinct(StringComparer.OrdinalIgnoreCase).ToList();

            if (distinct.Count == 1)
            {
                uniqueHosts[entry.Key] = distinct[0];
            }
        }

        return uniqueHosts;
    }

    public static Dictionary<string, string> BuildVisibleArmIdSet(IReadOnlyList<AzureExtractorExtendedResourceRow> resources)
    {
        ArgumentNullException.ThrowIfNull(resources);

        Dictionary<string, string> visible = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureExtractorExtendedResourceRow resource in resources)
        {
            string normalized = Normalize(resource.AzureResourceId);
            visible[normalized] = normalized;
        }

        return visible;
    }

    private static IEnumerable<string> ExtractKnownHosts(AzureExtractorExtendedResourceRow resource)
    {
        string resourceType = resource.ResourceType ?? string.Empty;
        string name = resource.Name ?? string.Empty;

        if (resourceType.Equals("Microsoft.Storage/storageAccounts", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.blob.core.windows.net";
            yield return $"{name.ToLowerInvariant()}.dfs.core.windows.net";
        }

        if (resourceType.Equals("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.database.windows.net";
        }

        if (resourceType.Equals("Microsoft.KeyVault/vaults", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.vault.azure.net";
        }

        if (resourceType.Equals("Microsoft.Synapse/workspaces", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.dev.azuresynapse.net";
            yield return $"{name.ToLowerInvariant()}.sql.azuresynapse.net";
        }

        if (resourceType.Equals("Microsoft.DocumentDB/databaseAccounts", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.documents.azure.com";
            yield return $"{name.ToLowerInvariant()}.mongo.cosmos.azure.com";
        }

        if (resourceType.Equals("Microsoft.DBforPostgreSQL/servers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.postgres.database.azure.com";
        }

        if (resourceType.Equals("Microsoft.DBforPostgreSQL/flexibleServers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.postgres.database.azure.com";
        }

        if (resourceType.Equals("Microsoft.DBforMySQL/servers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.mysql.database.azure.com";
        }

        if (resourceType.Equals("Microsoft.DBforMySQL/flexibleServers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.mysql.database.azure.com";
        }

        if (resourceType.Equals("Microsoft.Cache/redis", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.redis.cache.windows.net";
        }

        if (resourceType.Equals("Microsoft.EventHub/namespaces", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.servicebus.windows.net";
        }

        if (resourceType.Equals("Microsoft.ServiceBus/namespaces", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.servicebus.windows.net";
        }

        if (resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            yield return $"{name.ToLowerInvariant()}.azurewebsites.net";
        }

        if (resourceType.Equals("Microsoft.Databricks/workspaces", StringComparison.OrdinalIgnoreCase)
            && resource.Properties.TryGetValue("workspaceUrl", out string? workspaceUrl)
            && !string.IsNullOrWhiteSpace(workspaceUrl))
        {
            if (Uri.TryCreate(workspaceUrl.Trim(), UriKind.Absolute, out Uri? parsedUri)
                && !string.IsNullOrWhiteSpace(parsedUri.Host))
            {
                yield return parsedUri.Host.ToLowerInvariant();
            }
        }
    }

    private static string Normalize(string armId)
    {
        return ArmResourceIdNormalizer.Normalize(armId);
    }
}
