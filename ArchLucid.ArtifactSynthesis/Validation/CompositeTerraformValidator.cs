using ArchLucid.Core.Terraform;

namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>
///     Applies fast regex HCL checks first, then optional <c>terraform validate</c> when the CLI is available. Regex runs
///     first because it is cheap and fails fast on obvious LLM syntax errors; CLI validation is skipped silently when
///     Terraform is not installed (regex outcome still governs).
/// </summary>
public sealed class CompositeTerraformValidator : ITerraformValidator
{
    public static CompositeTerraformValidator Instance { get; } = new();

    private readonly RegexTerraformValidator _regexValidator = new();
    private readonly CliTerraformValidator _cliValidator = new();

    /// <inheritdoc />
    public TerraformValidationOutcome Validate(string hclBody)
    {
        ArgumentNullException.ThrowIfNull(hclBody);

        TerraformValidationOutcome regexOutcome = _regexValidator.Validate(hclBody);

        if (!regexOutcome.IsValid)
            return regexOutcome;

        TerraformValidationOutcome cliOutcome = _cliValidator.Validate(hclBody);

        if (!cliOutcome.IsValid)
            return cliOutcome;

        return TerraformValidationOutcome.Valid();
    }
}
