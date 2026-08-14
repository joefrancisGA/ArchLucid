using System.Globalization;

using ArchLucid.Contracts.Common;

namespace ArchLucid.Application.CloudInventoryExtractor;

/// <summary>Evidence-bundle citation fragments for AWS/GCP inventory-backed cost assertions.</summary>
public static class CloudInventoryExtractorCitationFormatter
{
    public static string FormatCostProofPoint(CloudInventoryExtractorNormalizedManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        DateTime utc = manifest.CollectionTimestamp.UtcDateTime;

        return string.Format(
            CultureInfo.InvariantCulture,
            "{0}InventoryZIP schemaVersion={1}; collectionTimestampUtc={2:o}; scopeId={3}",
            ProviderPrefix(manifest.CloudProvider),
            manifest.SchemaVersion,
            utc,
            manifest.ScopeId);
    }

    /// <summary>
    ///     Full persisted-package citation (includes <paramref name="packageId" />) for evidence bundles and cost traceability.
    /// </summary>
    public static string FormatStoredPackageCitation(
        Guid packageId,
        CloudProvider cloudProvider,
        int schemaVersion,
        DateTime collectionTimestampUtc,
        string scopeId)
    {
        if (collectionTimestampUtc.Kind != DateTimeKind.Utc)
            collectionTimestampUtc = collectionTimestampUtc.ToUniversalTime();

        return string.Format(
            CultureInfo.InvariantCulture,
            "{0}InventoryZIP packageId={1:N}; schemaVersion={2}; collectionTimestampUtc={3:o}; scopeId={4}",
            ProviderPrefix(cloudProvider),
            packageId,
            schemaVersion,
            collectionTimestampUtc,
            scopeId);
    }

    private static string ProviderPrefix(CloudProvider provider) =>
        provider switch
        {
            CloudProvider.Aws => "Aws",
            CloudProvider.Gcp => "Gcp",
            _ => "Cloud",
        };
}
