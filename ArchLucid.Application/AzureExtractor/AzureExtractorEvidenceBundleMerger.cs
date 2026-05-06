using System.Globalization;

using ArchLucid.Contracts.Agents;

using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.AzureExtractor;

/// <summary>
///     Applies Azure extractor ingest provenance onto <see cref="EvidenceBundle.Metadata" /> so starter tasks and agents
///     can cite persisted packages.
/// </summary>
public static class AzureExtractorEvidenceBundleMerger
{
    /// <summary>Evidence bundle metadata key: persisted <c>AzureExtractorPackages.PackageId</c> (hex "N").</summary>
    public const string MetadataPackageIdKey = "azureExtractorPackageId";

    /// <summary>Evidence bundle metadata key: manifest <c>schemaVersion</c>.</summary>
    public const string MetadataSchemaVersionKey = "azureExtractorSchemaVersion";

    /// <summary>Evidence bundle metadata key: UTC collection timestamp (round-trip "o").</summary>
    public const string MetadataCollectionTimestampUtcKey = "azureExtractorCollectionTimestampUtc";

    /// <summary>Evidence bundle metadata key: full citation line for cost assertions.</summary>
    public const string MetadataCostCitationKey = "azureExtractorCostCitation";

    /// <summary>Evidence bundle metadata key: optional subscription id from manifest.</summary>
    public const string MetadataSubscriptionIdKey = "azureExtractorSubscriptionId";

    /// <summary>Evidence bundle metadata key: original uploaded file name.</summary>
    public const string MetadataOriginalFileNameKey = "azureExtractorOriginalFileName";

    /// <returns><see langword="true"/> when the bundle includes Azure extractor grounding keys.</returns>
    public static bool BundlesExtractorMetadata(EvidenceBundle evidenceBundle)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);


        return evidenceBundle.Metadata.ContainsKey(MetadataPackageIdKey);
    }

    /// <summary>Overwrites extractor metadata keys using the latest ingest row for the run.</summary>
    public static void Merge(EvidenceBundle evidenceBundle, AzureExtractorPackageProvenance provenance)
    {
        ArgumentNullException.ThrowIfNull(evidenceBundle);


        ArgumentNullException.ThrowIfNull(provenance);


        DateTime collectionUtc = provenance.EffectiveCollectionUtc;


        if (collectionUtc.Kind != DateTimeKind.Utc)

            collectionUtc = collectionUtc.ToUniversalTime();


        Dictionary<string, string> metadata = evidenceBundle.Metadata;


        metadata[MetadataPackageIdKey] = provenance.PackageId.ToString("N", CultureInfo.InvariantCulture);


        metadata[MetadataSchemaVersionKey] = provenance.SchemaVersion.ToString(CultureInfo.InvariantCulture);


        metadata[MetadataCollectionTimestampUtcKey] = collectionUtc.ToString("o", CultureInfo.InvariantCulture);


        metadata[MetadataCostCitationKey] = AzureExtractorCitationFormatter.FormatStoredPackageCitation(
            provenance.PackageId,

            provenance.SchemaVersion,

            collectionUtc);


        if (string.IsNullOrWhiteSpace(provenance.SubscriptionId))

            metadata.Remove(MetadataSubscriptionIdKey);

        else


            metadata[MetadataSubscriptionIdKey] = provenance.SubscriptionId;


        if (string.IsNullOrWhiteSpace(provenance.OriginalFileName))

            metadata.Remove(MetadataOriginalFileNameKey);

        else


            metadata[MetadataOriginalFileNameKey] = provenance.OriginalFileName;

    }

}
