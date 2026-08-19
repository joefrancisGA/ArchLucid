namespace ArchLucid.Core.Terraform;

/// <summary>Validates advisory Terraform HCL before it is committed to manifests or exports.</summary>
public interface ITerraformValidator
{
    /// <summary>Returns whether <paramref name="hclBody"/> is syntactically acceptable for advisory emit.</summary>
    TerraformValidationOutcome Validate(string hclBody);
}
