using ArchLucid.Core.Manifest;

namespace ArchLucid.ArtifactSynthesis.Services;

/// <summary>Detects manifest decisions whose text implies infrastructure removal so advisory Terraform stays comment-only.</summary>
public static class TerraformAdvisoryDecommissionIntentDetector
{
    /// <summary>
    ///     Substrings that imply destructive intent. When matched, ArchLucid emits comment-only advisory HCL — never
    ///     <c>terraform destroy</c> blocks — because removal requires explicit human review under customer change control.
    /// </summary>
    private static readonly string[] Markers =
    [
        "delete",
        "remove",
        "decommission",
        "tear down",
        "tear-down",
        "unprovision",
        "destroy",
    ];

    /// <summary>
    ///     Scans decision title, category, selected option, rationale, and raw JSON for decommission language.
    /// </summary>
    public static bool LooksLikeDecommissionRequest(ResolvedArchitectureDecision decision)
    {
        ArgumentNullException.ThrowIfNull(decision);

        string haystack = string.Join(
            '\n',
            [
                decision.Title,
                decision.Category,
                decision.SelectedOption,
                decision.Rationale,
                decision.RawDecisionJson ?? string.Empty,
            ]);

        return Markers.Any(marker => haystack.Contains(marker, StringComparison.OrdinalIgnoreCase));
    }
}
