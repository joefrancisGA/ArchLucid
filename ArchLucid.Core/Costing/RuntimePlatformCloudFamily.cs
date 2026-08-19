using ArchLucid.Contracts.Common;

namespace ArchLucid.Core.Costing;

/// <summary>Maps <see cref="RuntimePlatform"/> values to target-cloud families for costing labels.</summary>
public static class RuntimePlatformCloudFamily
{
    public static CloudProvider ResolveCloudFamily(RuntimePlatform platform) =>
        platform switch
        {
            RuntimePlatform.Ec2 or RuntimePlatform.Lambda or RuntimePlatform.Eks or RuntimePlatform.Rds
                or RuntimePlatform.S3 or RuntimePlatform.ElastiCache =>
                CloudProvider.Aws,
            RuntimePlatform.ComputeEngine or RuntimePlatform.Gke or RuntimePlatform.CloudSql or RuntimePlatform.Gcs =>
                CloudProvider.Gcp,
            _ => CloudProvider.Azure,
        };

    public static bool IsAws(RuntimePlatform platform) =>
        ResolveCloudFamily(platform) == CloudProvider.Aws;

    public static bool IsGcp(RuntimePlatform platform) =>
        ResolveCloudFamily(platform) == CloudProvider.Gcp;
}
