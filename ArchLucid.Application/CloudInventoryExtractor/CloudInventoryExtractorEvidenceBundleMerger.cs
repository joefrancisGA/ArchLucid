using System.Globalization;

using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.CloudInventoryExtractor;

/// <summary>
///     Applies AWS/GCP inventory ingest provenance onto <see cref="EvidenceBundle.Metadata" /> so starter tasks and agents
///     can cite persisted packages.
/// </summary>
public static class CloudInventoryExtractorEvidenceBundleMerger
{
    /// <summary>Evidence bundle metadata key: persisted package id (hex "N").</summary>
    public static string MetadataPackageIdKey(CloudProvider cloudProvider) =>
        $"{ProviderMetadataPrefix(cloudProvider)}PackageId";

    /// <summary>Evidence bundle metadata key: manifest <c>schemaVersion</c>.</summary>
    public static string MetadataSchemaVersionKey(CloudProvider cloudProvider) =>
        $"{ProviderMetadataPrefix(cloudProvider)}SchemaVersion";

    /// <summary>Evidence bundle metadata key: UTC collection timestamp (round-trip "o").</summary>
    public static string MetadataCollectionTimestampUtcKey(CloudProvider cloudProvider) =>
        $"{ProviderMetadataPrefix(cloudProvider)}CollectionTimestampUtc";

    /// <summary>Evidence bundle metadata key: full citation line for cost assertions.</summary>
    public static string MetadataCostCitationKey(CloudProvider cloudProvider) =>
        $"{ProviderMetadataPrefix(cloudProvider)}CostCitation";

    /// <summary>Evidence bundle metadata key: manifest scope id.</summary>
    public static string MetadataScopeIdKey(CloudProvider cloudProvider) =>
        $"{ProviderMetadataPrefix(cloudProvider)}ScopeId";

    /// <summary>Evidence bundle metadata key: original uploaded file name.</summary>
    public static string MetadataOriginalFileNameKey(CloudProvider cloudProvider) =>
        $"{ProviderMetadataPrefix(cloudProvider)}OriginalFileName";

    /// <returns><see langword="true"/> when the bundle includes inventory grounding keys for <paramref name="cloudProvider" />.</returns>
    public static bool BundlesExtractorMetadata(EvidenceBundle evidenceBundle, CloudProvider cloudProvider)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);

        if (cloudProvider is not CloudProvider.Aws and not CloudProvider.Gcp)
            return false;

        return evidenceBundle.Metadata.ContainsKey(MetadataPackageIdKey(cloudProvider));
    }

    /// <summary>Overwrites inventory metadata keys using the latest ingest row for the run.</summary>
    public static void Merge(EvidenceBundle evidenceBundle, CloudInventoryExtractorPackageProvenance provenance)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);

        ArgumentNullException.ThrowIfNull(provenance);

        if (provenance.CloudProvider is not CloudProvider.Aws and not CloudProvider.Gcp)
            throw new ArgumentOutOfRangeException(
                nameof(provenance),
                provenance.CloudProvider,
                "Cloud inventory evidence merge supports AWS and GCP targets only.");

        DateTime collectionUtc = provenance.EffectiveCollectionUtc;

        if (collectionUtc.Kind != DateTimeKind.Utc)
            collectionUtc = collectionUtc.ToUniversalTime();

        Dictionary<string, string> metadata = evidenceBundle.Metadata;
        CloudProvider cloudProvider = provenance.CloudProvider;

        metadata[MetadataPackageIdKey(cloudProvider)] =
            provenance.PackageId.ToString("N", CultureInfo.InvariantCulture);

        metadata[MetadataSchemaVersionKey(cloudProvider)] =
            provenance.SchemaVersion.ToString(CultureInfo.InvariantCulture);

        metadata[MetadataCollectionTimestampUtcKey(cloudProvider)] =
            collectionUtc.ToString("o", CultureInfo.InvariantCulture);

        metadata[MetadataCostCitationKey(cloudProvider)] =
            CloudInventoryExtractorCitationFormatter.FormatStoredPackageCitation(
                provenance.PackageId,
                cloudProvider,
                provenance.SchemaVersion,
                collectionUtc,
                provenance.ScopeId);

        if (string.IsNullOrWhiteSpace(provenance.ScopeId))
            metadata.Remove(MetadataScopeIdKey(cloudProvider));
        else
            metadata[MetadataScopeIdKey(cloudProvider)] = provenance.ScopeId;

        if (string.IsNullOrWhiteSpace(provenance.OriginalFileName))
            metadata.Remove(MetadataOriginalFileNameKey(cloudProvider));
        else
            metadata[MetadataOriginalFileNameKey(cloudProvider)] = provenance.OriginalFileName;
    }

    private static string ProviderMetadataPrefix(CloudProvider cloudProvider) =>
        cloudProvider switch
        {
            CloudProvider.Aws => "awsExtractor",
            CloudProvider.Gcp => "gcpExtractor",
            _ => throw new ArgumentOutOfRangeException(nameof(cloudProvider), cloudProvider, "Unsupported cloud provider."),
        };
}
