using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>Maps AWS Terraform resource types to costing <see cref="RuntimePlatform"/> values.</summary>
public static class AwsResourceCostMapper
{
    /// <summary>Infers costing platform from Terraform type tail (e.g. <c>aws_instance</c>).</summary>
    public static RuntimePlatform? TryInferPlatformFromTerraformType(string? terraformType)
    {
        if (string.IsNullOrWhiteSpace(terraformType))
            return null;

        ReadOnlySpan<char> tail = TerraformTypeTail.Normalize(terraformType);

        if (tail.Equals("aws_instance".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Ec2;

        if (tail.Equals("aws_lambda_function".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Lambda;

        if (tail.Equals("aws_eks_cluster".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Eks;

        if (tail.Equals("aws_db_instance".AsSpan(), StringComparison.OrdinalIgnoreCase) ||
            tail.Equals("aws_rds_cluster".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.Rds;

        if (tail.Equals("aws_s3_bucket".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.S3;

        if (tail.Equals("aws_elasticache_cluster".AsSpan(), StringComparison.OrdinalIgnoreCase) ||
            tail.Equals("aws_elasticache_replication_group".AsSpan(), StringComparison.OrdinalIgnoreCase))
            return RuntimePlatform.ElastiCache;

        return null;
    }
}
