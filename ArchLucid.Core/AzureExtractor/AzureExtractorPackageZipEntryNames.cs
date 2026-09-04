namespace ArchLucid.Core.AzureExtractor;

/// <summary>Well-known entry names inside Azure extractor ZIP archives.</summary>
public static class AzureExtractorPackageZipEntryNames
{
    public const string Manifest = "manifest.json";

    public const string Resources = "resources.json";

    public const string RoleAssignments = "role-assignments.json";

    public const string DiagnosticSettings = "diagnostic-settings.json";

    public const string NetworkAssociations = "network-associations.json";

    public const string PolicyAssignments = "policy-assignments.json";

    public const string DefenderSummary = "defender-summary.json";

    public static IReadOnlyCollection<string> OptionalInventoryEntryNames { get; } =
    [
        RoleAssignments,
        DiagnosticSettings,
        NetworkAssociations,
        PolicyAssignments,
        DefenderSummary,
    ];
}
