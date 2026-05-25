using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Terraform;

namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>Post-processes advisory Terraform before manifest commit or artifact emit.</summary>
public static class TerraformAdvisoryHclSanitizer
{
    public const string ValidationWarningPrefix =
        "# WARNING: Generated Terraform snippet failed validation and was omitted.";

    /// <summary>
    ///     Validates advisory HCL and returns the original body when valid. On failure, replaces content with a
    ///     comment-only stub so exports remain valid Terraform (comments only) rather than throwing away the artifact.
    /// </summary>
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

    /// <summary>
    ///     Builds comment-only HCL that passes fmt/validate: the stub is itself valid advisory output (hash comments),
    ///     not an exception — operators see the validation reason inline in the <c>.tf</c> file.
    /// </summary>
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
