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

    /// <summary>
    ///     Derives a Terraform resource address hint for operators. Prefer graph node ids; when
    ///     <see cref="ResolvedArchitectureDecision.SelectedOption" /> looks like a dotted Terraform address
    ///     (e.g. <c>azurerm_resource_group.example</c>), use it directly.
    /// </summary>
    private static string TryResolveResourceAddressHint(ResolvedArchitectureDecision decision)
    {
        string option = decision.SelectedOption.Trim();

        if (option.Length > 0 && option.Contains('.'))
            return option;

        if (decision.RelatedNodeIds is { Count: > 0 })
        {
            foreach (string nodeId in decision.RelatedNodeIds)
            {
                string trimmed = nodeId.Trim();
                if (trimmed.Length > 0 && trimmed.Contains('.'))
                    return trimmed;
            }

            return "Graph node ids were stored but a Terraform address was not stored.";
        }

        return "Terraform address was not stored.";
    }
}
