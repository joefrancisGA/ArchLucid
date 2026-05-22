using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Terraform;

namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>Post-processes advisory Terraform before manifest commit or artifact emit.</summary>
public static class TerraformAdvisoryHclSanitizer
{
    public const string ValidationWarningPrefix =
        "# WARNING: Generated Terraform snippet failed validation and was omitted.";

    public static string ValidateAndSanitize(string hclBody, ITerraformValidator? validator = null)
    {
        ArgumentNullException.ThrowIfNull(hclBody);
        ITerraformValidator effectiveValidator = validator ?? CompositeTerraformValidator.Instance;
        TerraformValidationOutcome outcome = effectiveValidator.Validate(hclBody);

        if (outcome.IsValid)
            return hclBody;

        string reason = outcome.FailureReason ?? "Unknown validation failure.";
        return BuildValidationWarningStub(reason);
    }

    public static string BuildValidationWarningStub(string reason)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);
        return string.Join(
            Environment.NewLine,
            TerraformAdvisoryDecommissionSnippetBuilder.AdvisoryHeaderLine,
            ValidationWarningPrefix,
            $"# Reason: {reason.Trim()}");
    }
}
