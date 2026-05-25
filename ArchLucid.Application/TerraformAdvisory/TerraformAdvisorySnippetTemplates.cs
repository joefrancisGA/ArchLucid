using ArchLucid.ArtifactSynthesis.Validation;

namespace ArchLucid.Application.TerraformAdvisory;

/// <summary>
///     Reusable advisory-only Terraform fragments (HCL comment blocks). ArchLucid never runs
///     <c>terraform apply</c>; customers review and apply under their own change control.
/// </summary>
public static class TerraformAdvisorySnippetTemplates
{
    public const string AdvisoryHeaderLine = "# ArchLucid advisory – review before apply";

    /// <summary>Example right-size VM advisory block for tests and documentation (no provider block).</summary>
    public static string ExampleRightSizeVmSnippet(string findingId, string recommendationId)
    {
        ArgumentNullException.ThrowIfNull(findingId);
        ArgumentNullException.ThrowIfNull(recommendationId);
        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(recommendationId))
            throw new ArgumentException("recommendationId is required.", nameof(recommendationId));
        // Example only: real emits must match live resource addressing and cite extractor manifest + retail row.
        return $"{AdvisoryHeaderLine}\n# findingId={findingId} recommendationId={recommendationId}\n" +
               "# Replace with a real resource block after aztfexport; placeholder comments keep fmt/validate green in CI.\n";
    }

    /// <summary>
    ///     Static guard test: ArchLucid must not emit silent destroy blocks for orphan removal without UI gate.
    ///     Returns comment-only HCL explaining why destroy was omitted.
    /// </summary>
    public static string ExplainerInsteadOfDestroy(string resourceTerraformAddress, string reason)
    {
        ArgumentNullException.ThrowIfNull(resourceTerraformAddress);
        ArgumentNullException.ThrowIfNull(reason);
        return $"{AdvisoryHeaderLine}\n# Omitting terraform destroy for `{resourceTerraformAddress}` — {reason}\n";
    }

    /// <summary>
    ///     Sanitizes LLM-generated Terraform blocks: rejects explicit destroy verbs, then runs composite validation
    ///     (regex + optional <c>terraform validate</c>).
    /// </summary>
    public static string SanitizeLlmTerraformBlock(string llmOutput)
    {
        ArgumentNullException.ThrowIfNull(llmOutput);

        if (llmOutput.Contains("destroy", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Validation failed: LLM generated a Terraform block containing the destructive verb 'destroy'.");

        return TerraformAdvisoryHclSanitizer.ValidateAndSanitize(llmOutput);
    }
}
