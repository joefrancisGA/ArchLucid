using System.Globalization;

namespace ArchLucid.Application.AzureExtractor;

/// <summary>Evidence-bundle citation fragments for extractor-backed cost assertions (per V1 citation doctrine).</summary>
public static class AzureExtractorCitationFormatter
{
    /// <summary>Returns a stable proof string including schema version and UTC collection timestamp.</summary>
    public static string FormatCostProofPoint(AzureExtractorNormalizedManifest manifest)
    {
        ArgumentNullException.ThrowIfNull(manifest);

        return string.Format(
            CultureInfo.InvariantCulture,

            "AzureExtractorZIP schemaVersion={0}; collectionTimestampUtc={1:o}",

            manifest.SchemaVersion,

            manifest.CollectionTimestamp.UtcDateTime);
    }
}
