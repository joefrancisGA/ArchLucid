using ArchLucid.Core.Manifest;

namespace ArchLucid.ArtifactSynthesis.Services;

/// <summary>Detects manifest decisions whose text implies infrastructure removal so advisory Terraform stays comment-only.</summary>
public static class TerraformAdvisoryDecommissionIntentDetector
{
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
