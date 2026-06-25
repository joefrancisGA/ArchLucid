using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.AwsExtractor;

/// <summary>Maps AWS inventory resource types to costing <see cref="RuntimePlatform"/> values.</summary>
public static class AwsInventoryResourceCostMapper
{
    /// <summary>Infers costing platform from CloudFormation or Resource Explorer type strings.</summary>
    public static RuntimePlatform? TryInferPlatform(string? resourceType)
    {
        if (string.IsNullOrWhiteSpace(resourceType))
            return null;

        ReadOnlySpan<char> type = resourceType.AsSpan().Trim();

        if (Contains(type, "EC2::Instance") || Contains(type, "ec2:instance"))
            return RuntimePlatform.Ec2;

        if (Contains(type, "Lambda::Function") || Contains(type, "lambda:function"))
            return RuntimePlatform.Lambda;

        if (Contains(type, "EKS::Cluster") || Contains(type, "eks:cluster"))
            return RuntimePlatform.Eks;

        if (Contains(type, "RDS::DBInstance") || Contains(type, "rds:db") || Contains(type, "RDS::DBCluster"))
            return RuntimePlatform.Rds;

        if (Contains(type, "S3::Bucket") || Contains(type, "s3:bucket"))
            return RuntimePlatform.S3;

        if (Contains(type, "ElastiCache::") || Contains(type, "elasticache:"))
            return RuntimePlatform.ElastiCache;

        return null;
    }

    private static bool Contains(ReadOnlySpan<char> haystack, string needle) =>
        haystack.Contains(needle.AsSpan(), StringComparison.OrdinalIgnoreCase);
}
