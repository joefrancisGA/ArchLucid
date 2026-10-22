namespace ArchLucid.Integrations.AzureExtractor;

/// <summary>
///     Merges type-scoped ARM list payloads onto subscription index rows by normalized ARM id (IE-RF-03).
/// </summary>
internal static class HostedAzureArmResourceRecordMerger
{
    public static IReadOnlyList<HostedAzureArmResourceRecord> MergeByResourceId(
        IReadOnlyList<HostedAzureArmResourceRecord> indexResources,
        IReadOnlyList<HostedAzureArmResourceRecord> typedListResources)
    {
        ArgumentNullException.ThrowIfNull(indexResources);
        ArgumentNullException.ThrowIfNull(typedListResources);

        if (typedListResources.Count == 0)
        {
            return indexResources;
        }

        Dictionary<string, HostedAzureArmResourceRecord> merged = indexResources
            .ToDictionary(resource => NormalizeId(resource.ResourceId), StringComparer.OrdinalIgnoreCase);

        foreach (HostedAzureArmResourceRecord typedResource in typedListResources)
        {
            string normalizedId = NormalizeId(typedResource.ResourceId);

            if (merged.TryGetValue(normalizedId, out HostedAzureArmResourceRecord? existing))
            {
                merged[normalizedId] = MergeRecords(existing, typedResource);
                continue;
            }

            merged[normalizedId] = typedResource;
        }

        return merged.Values.ToList();
    }

    private static HostedAzureArmResourceRecord MergeRecords(
        HostedAzureArmResourceRecord indexRecord,
        HostedAzureArmResourceRecord typedRecord)
    {
        Dictionary<string, object?> properties = new(StringComparer.OrdinalIgnoreCase);

        if (indexRecord.Properties is not null)
        {
            foreach (KeyValuePair<string, object?> property in indexRecord.Properties)
            {
                properties[property.Key] = property.Value;
            }
        }

        if (typedRecord.Properties is not null)
        {
            foreach (KeyValuePair<string, object?> property in typedRecord.Properties)
            {
                properties[property.Key] = property.Value;
            }
        }

        return indexRecord with { Properties = properties };
    }

    private static string NormalizeId(string resourceId)
    {
        return resourceId.Trim().ToLowerInvariant();
    }
}
