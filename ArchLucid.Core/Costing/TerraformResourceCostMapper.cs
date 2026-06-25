using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>Unified Terraform resource-type to <see cref="RuntimePlatform"/> inference for multi-cloud costing.</summary>
public static class TerraformResourceCostMapper
{
    public static bool TryInferPlatformFromTerraformType(string? terraformType, out RuntimePlatform platform)
    {
        platform = default;

        RuntimePlatform? aws = AwsResourceCostMapper.TryInferPlatformFromTerraformType(terraformType);

        if (aws.HasValue)
        {
            platform = aws.Value;

            return true;
        }

        RuntimePlatform? gcp = GcpResourceCostMapper.TryInferPlatformFromTerraformType(terraformType);

        if (gcp.HasValue)
        {
            platform = gcp.Value;

            return true;
        }

        return false;
    }
}
