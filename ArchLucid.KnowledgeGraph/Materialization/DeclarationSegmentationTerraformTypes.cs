namespace ArchLucid.KnowledgeGraph.Materialization;

/// <summary>
///     Shared NSG / SG / firewall type predicates for segmentation path edges (DX-76).
/// </summary>
public static class DeclarationSegmentationTerraformTypes
{
    public static bool IsSegmentationControlTerraformType(string? terraformType)
    {
        if (string.IsNullOrWhiteSpace(terraformType))
            return false;

        if (IsSegmentationAssociationTerraformType(terraformType))
            return false;

        return terraformType.Contains("network_security_group", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("aws_security_group", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("google_compute_firewall", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("network_security_rule", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsSegmentationAssociationTerraformType(string? terraformType)
    {
        if (string.IsNullOrWhiteSpace(terraformType))
            return false;

        bool isAssociation = terraformType.Contains("association", StringComparison.OrdinalIgnoreCase);

        if (!isAssociation)
            return false;

        return terraformType.Contains("security_group", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("nsg", StringComparison.OrdinalIgnoreCase)
            || terraformType.Contains("firewall", StringComparison.OrdinalIgnoreCase);
    }
}
