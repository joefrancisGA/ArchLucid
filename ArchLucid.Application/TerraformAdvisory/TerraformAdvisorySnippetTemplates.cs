namespace ArchLucid.Application.TerraformAdvisory;
/// <summary>Reusable advisory-only Terraform fragments (never applied by ArchLucid; customer runs plan/apply).</summary>
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
        return $"{AdvisoryHeaderLine}\n# findingId={findingId} recommendationId={recommendationId}\n" + "# Replace with a real resource block after aztfexport; placeholder comments keep fmt/validate green in CI.\n";
    }

    /// <summary>Static guard test: ArchLucid must not emit silent destroy blocks for orphan removal without UI gate.</summary>
    public static string ExplainerInsteadOfDestroy(string resourceTerraformAddress, string reason)
    {
        ArgumentNullException.ThrowIfNull(resourceTerraformAddress);
        ArgumentNullException.ThrowIfNull(reason);
        return $"{AdvisoryHeaderLine}\n# Omitting terraform destroy for `{resourceTerraformAddress}` — {reason}";
    }
}