using ArchLucid.Core.Terraform;

namespace ArchLucid.ArtifactSynthesis.Validation;

/// <summary>Applies regex checks first, then optional <c>terraform validate</c> when the CLI is available.</summary>
public sealed class CompositeTerraformValidator : ITerraformValidator
{
    public static CompositeTerraformValidator Instance { get; } = new();

    private readonly RegexTerraformValidator _regexValidator = new();
    private readonly CliTerraformValidator _cliValidator = new();

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
