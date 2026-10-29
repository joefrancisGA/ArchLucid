using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

namespace ArchLucid.ArtifactSynthesis.Docx;

internal static class DocxExportManifestPostureHonesty
{
    internal const int RecommendedImprovementsExportCap = 10;

    internal const string RecommendedImprovementsGeneratedExportLabel =
        "These recommendations were generated for this export and are not stored on the committed manifest.";

    internal static string FormatRecommendedImprovementsOverflowLine(int totalCount)
    {
        int omitted = totalCount - RecommendedImprovementsExportCap;

        return
            $"This export lists {RecommendedImprovementsExportCap} of {totalCount} generated recommendations ({omitted} more were not listed).";
    }

    internal static string FormatCostCurrencyLine(string? currencyCode) =>
        $"Cost currency: {ArchitectureManifestNarrativeHonestyCopy.FormatCostCurrency(currencyCode)}";

    internal static string FormatDiagramFallbackTopologyCensusLine(ManifestDocument manifest)
    {
        TopologySection? topology = manifest.Topology;
        string resources = FormatNullableListCensus(topology?.Resources, "Topology resources");
        string patterns = FormatNullableListCensus(topology?.SelectedPatterns, "Selected patterns");
        string decisions = FormatListCensus(manifest.Decisions, "Decisions");

        return
            $"Committed manifest census — {resources}; {patterns}; {decisions}. See Topology Posture and Decisions below for full detail.";
    }

    internal static string FormatAssumptionBullet(string? assumption) =>
        ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(
            assumption,
            "Assumption was not stored.",
            "Assumption was stored empty.");

    internal static string FormatMandatoryConstraintLine(string? item) =>
        $"Mandatory: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(item, "Mandatory constraint was not stored.", "Mandatory constraint was stored empty.")}";

    internal static string FormatPreferenceConstraintLine(string? item) =>
        $"Preference: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(item, "Preference was not stored.", "Preference was stored empty.")}";

    internal static string FormatComplianceGapLine(string? gap) =>
        $"Compliance gap: {ArchitectureManifestNarrativeHonestyCopy.FormatStoredStringField(gap, "Compliance gap was not stored.", "Compliance gap was stored empty.")}";

    private static string FormatNullableListCensus(IReadOnlyList<string>? values, string label)
    {
        if (values is null)
        {
            return $"{label}: not stored";
        }

        if (values.Count == 0)
        {
            return $"{label}: stored empty";
        }

        return $"{label}: {values.Count} stored";
    }

    private static string FormatListCensus<T>(IReadOnlyList<T>? values, string label)
    {
        if (values is null)
        {
            return $"{label}: not stored";
        }

        if (values.Count == 0)
        {
            return $"{label}: stored empty";
        }

        return $"{label}: {values.Count} stored";
    }
}
