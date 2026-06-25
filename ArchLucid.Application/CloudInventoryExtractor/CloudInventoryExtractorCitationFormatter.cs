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

    private static string ProviderPrefix(CloudProvider provider) =>
        provider switch
        {
            CloudProvider.Aws => "Aws",
            CloudProvider.Gcp => "Gcp",
            _ => "Cloud",
        };
}
