namespace ArchLucid.Core.Costing;

/// <summary>Terraform resource row used to build illustrative infrastructure cost nodes.</summary>
public readonly record struct TerraformInfrastructureCostResourceRow(
    string DisplayName,
    string TerraformType,
    string? Region);
