using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Resolves sanitized ADF linked-service targets against inventoried Azure resources.
/// </summary>
public static class AzureInventoryAdfLinkedServiceTargetResolver
{
    private static readonly string[] StorageDataPlaneSuffixes =
    [
        "blob.core.windows.net",
        "dfs.core.windows.net",
        "queue.core.windows.net",
        "table.core.windows.net",
        "file.core.windows.net",
    ];

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
            foreach (string suffix in StorageDataPlaneSuffixes)
            {
                foreach (string host in WithPrivateLinkAlias($"{name}.{suffix}"))
                {
                    yield return host;
                }
            }
        }

        if (resourceType.Equals("Microsoft.Sql/servers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.database.windows.net"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.KeyVault/vaults", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            string loweredName = name.ToLowerInvariant();
            yield return $"{loweredName}.vault.azure.net";

            if (!loweredName.Contains('.', StringComparison.Ordinal))
            {
                yield return $"{loweredName}.privatelink.vaultcore.azure.net";
            }
        }

        if (resourceType.Equals("Microsoft.Synapse/workspaces", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.dev.azuresynapse.net"))
            {
                yield return host;
            }

            foreach (string host in WithPrivateLinkAlias($"{name}.sql.azuresynapse.net"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.DocumentDB/databaseAccounts", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.documents.azure.com"))
            {
                yield return host;
            }

            foreach (string host in WithPrivateLinkAlias($"{name}.mongo.cosmos.azure.com"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.DBforPostgreSQL/servers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.postgres.database.azure.com"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.DBforPostgreSQL/flexibleServers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.postgres.database.azure.com"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.DBforMySQL/servers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.mysql.database.azure.com"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.DBforMySQL/flexibleServers", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.mysql.database.azure.com"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.Cache/redis", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.redis.cache.windows.net"))
            {
                yield return host;
            }

            string? locationSlug = NormalizeInventoryLocationSlug(resource.Location);

            if (!string.IsNullOrWhiteSpace(locationSlug))
            {
                foreach (string host in WithPrivateLinkAlias($"{name}.{locationSlug}.redis.azure.net"))
                {
                    yield return host;
                }
            }
        }

        if (resourceType.Equals("Microsoft.EventHub/namespaces", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.servicebus.windows.net"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.ServiceBus/namespaces", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.servicebus.windows.net"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.Web/sites", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.azurewebsites.net"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.App/containerApps", StringComparison.OrdinalIgnoreCase)
            && resource.Properties.TryGetValue("configuration.ingress.fqdn", out string? ingressFqdn)
            && !string.IsNullOrWhiteSpace(ingressFqdn))
        {
            yield return ingressFqdn.Trim().ToLowerInvariant();
        }

        if (resourceType.Equals("Microsoft.Sql/servers/databases", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name)
            && TryReadSqlServerName(resource.AzureResourceId, out string? sqlServerName)
            && !AzureInventoryNeverShowSqlDatabaseNames.ShouldOmit(resourceType, resource.AzureResourceId, name))
        {
            string publicHost = $"{sqlServerName.ToLowerInvariant()}.database.windows.net";

            foreach (string host in WithPrivateLinkAlias(publicHost))
            {
                yield return $"{host}|{name.ToLowerInvariant()}";
            }
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

        if (resourceType.Equals("Microsoft.CognitiveServices/accounts", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            string loweredName = name.ToLowerInvariant();

            // SN-RT-04: OpenAI and Content Safety accounts share Cognitive Services ARM type; index both host suffixes.
            foreach (string host in WithPrivateLinkAlias($"{loweredName}.openai.azure.com"))
            {
                yield return host;
            }

            foreach (string host in WithPrivateLinkAlias($"{loweredName}.cognitiveservices.azure.com"))
            {
                yield return host;
            }
        }

        if (resourceType.Equals("Microsoft.Search/searchServices", StringComparison.OrdinalIgnoreCase)
            && !string.IsNullOrWhiteSpace(name))
        {
            foreach (string host in WithPrivateLinkAlias($"{name}.search.windows.net"))
            {
                yield return host;
            }
        }
    }

    private static IEnumerable<string> WithPrivateLinkAlias(string publicHost)
    {
        string normalizedHost = publicHost.Trim().ToLowerInvariant();
        yield return normalizedHost;

        int firstDot = normalizedHost.IndexOf('.');

        if (firstDot <= 0
            || firstDot >= normalizedHost.Length - 1
            || normalizedHost.Contains(".privatelink.", StringComparison.Ordinal))
        {
            yield break;
        }

        yield return $"{normalizedHost[..(firstDot + 1)]}privatelink.{normalizedHost[(firstDot + 1)..]}";
    }

    private static string? NormalizeInventoryLocationSlug(string? location)
    {
        if (string.IsNullOrWhiteSpace(location))
        {
            return null;
        }

        return location.Trim().ToLowerInvariant().Replace(" ", string.Empty);
    }

    private static string Normalize(string armId)
    {
        return ArmResourceIdNormalizer.Normalize(armId);
    }

    private static bool TryReadSqlServerName(string azureResourceId, out string sqlServerName)
    {
        sqlServerName = string.Empty;

        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return false;
        }

        string[] segments = azureResourceId.Split(
            '/',
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        for (int index = 0; index < segments.Length - 1; index++)
        {
            if (segments[index].Equals("servers", StringComparison.OrdinalIgnoreCase)
                && index + 1 < segments.Length)
            {
                sqlServerName = segments[index + 1];

                return !string.IsNullOrWhiteSpace(sqlServerName);
            }
        }

        return false;
    }
}
