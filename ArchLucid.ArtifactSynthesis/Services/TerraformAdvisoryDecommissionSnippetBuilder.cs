using System.Text;

using ArchLucid.Core.Manifest;

namespace ArchLucid.ArtifactSynthesis.Services;

/// <summary>Builds advisory-only Terraform comments (no resource blocks) for decommission-style decisions.</summary>
public static class TerraformAdvisoryDecommissionSnippetBuilder
{
    public const string AdvisoryHeaderLine = "# ArchLucid advisory – review before apply";

    /// <summary>Points operators at bundled <c>ADVISORY.md</c>; wording avoids spelling destructive Terraform verbs in <c>.tf</c> output.</summary>
    public const string AdvisoryMdPointerLine =
        "# See ADVISORY.md in the Terraform advisory export bundle — ArchLucid never runs apply or removal on your behalf.";

    public static string BuildDecisionSection(ResolvedArchitectureDecision decision)
    {
        ArgumentNullException.ThrowIfNull(decision);

        string addressHint = TryResolveResourceAddressHint(decision);

        StringBuilder sb = new();
        sb.AppendLine(AdvisoryHeaderLine);
        sb.AppendLine(AdvisoryMdPointerLine);
        sb.AppendLine(
            $"# Decision {decision.DecisionId} — agent asked to change infrastructure; emitting comment-only advisory (no automated removal blocks).");
        sb.AppendLine($"# Terraform address hint: {addressHint}");

        return sb.ToString().TrimEnd();
    }

    public static string BuildNoDecommissionManifestStub() =>
        string.Join(
            Environment.NewLine,
            AdvisoryHeaderLine,
            "# No decommission-style decisions in this manifest — no removal blocks emitted.");

    private static string TryResolveResourceAddressHint(ResolvedArchitectureDecision decision)
    {
        if (decision.RelatedNodeIds is { Count: > 0 })
            return string.Join(", ", decision.RelatedNodeIds);

        string option = decision.SelectedOption.Trim();

        if (option.Length > 0 && option.Contains('.'))
            return option;

        return "(unspecified — validate against extractor manifest)";
    }
}
