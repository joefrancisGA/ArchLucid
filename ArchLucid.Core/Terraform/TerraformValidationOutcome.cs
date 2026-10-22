namespace ArchLucid.Core.Terraform;

/// <summary>Result of advisory Terraform HCL validation.</summary>
public sealed record TerraformValidationOutcome(bool IsValid, string? FailureReason)
{
    public static TerraformValidationOutcome Valid() => new(true, null);

    public static TerraformValidationOutcome Invalid(string reason)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(reason);
        return new(false, reason);
    }
}
