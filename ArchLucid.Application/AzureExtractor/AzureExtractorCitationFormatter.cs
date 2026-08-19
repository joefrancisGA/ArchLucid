using System.Globalization;

namespace ArchLucid.Application.AzureExtractor;

/// <summary>Evidence-bundle citation fragments for extractor-backed cost assertions (per V1 citation doctrine).</summary>
public static class AzureExtractorCitationFormatter
{
    /// <summary>Returns a stable proof string including schema version and UTC collection timestamp.</summary>
    public static string FormatCostProofPoint(AzureExtractorNormalizedManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        DateTime utc = manifest.CollectionTimestamp.UtcDateTime;

        return FormatCostProofManifestOnly(manifest.SchemaVersion, utc);
    }

    /// <summary>Returns proof text for ingest audit rows before a <paramref name="packageId" /> is minted.</summary>
    internal static string FormatCostProofManifestOnly(int schemaVersion, DateTime collectionTimestampUtc)
    {
        return string.Format(
            CultureInfo.InvariantCulture,
            "AzureExtractorZIP schemaVersion={0}; collectionTimestampUtc={1:o}",
            schemaVersion,
            collectionTimestampUtc);
    }

    /// <summary>
    ///     Full persisted-package citation (includes <paramref name="packageId" />) for evidence bundles and cost traceability.
    /// </summary>
    public static string FormatStoredPackageCitation(Guid packageId, int schemaVersion, DateTime collectionTimestampUtc)
    {
        if (collectionTimestampUtc.Kind != DateTimeKind.Utc)
            collectionTimestampUtc = collectionTimestampUtc.ToUniversalTime();

        return string.Format(
            CultureInfo.InvariantCulture,
            "AzureExtractorZIP packageId={0:N}; schemaVersion={1}; collectionTimestampUtc={2:o}",
            packageId,
            schemaVersion,
            collectionTimestampUtc);
    }
}
