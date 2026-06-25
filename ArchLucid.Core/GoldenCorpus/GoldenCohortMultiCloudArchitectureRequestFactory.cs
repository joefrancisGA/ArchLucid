using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

namespace ArchLucid.Core.GoldenCorpus;

/// <summary>Builds AWS/GCP golden-cohort simulator requests (Phase 4 multi-cloud fixtures).</summary>
public static class GoldenCohortMultiCloudArchitectureRequestFactory
{
    public static ArchitectureRequest BuildAwsWebWorkload(string suffix)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(suffix);

        return new ArchitectureRequest
        {
            RequestId = $"golden-cohort-aws-{suffix}".ToLowerInvariant(),
            SystemName = $"GoldenCohort_Aws_{suffix}",
            Description =
                "Single-region AWS web workload with ALB, EC2 or Lambda, and RDS PostgreSQL. Prefer managed services.",
            Environment = "prod",
            CloudProvider = CloudProvider.Aws,
            Constraints = ["Golden cohort AWS regression", "No public S3 buckets"],
            RequiredCapabilities = ["HTTPS API", "Relational datastore"],
        };
    }

    public static ArchitectureRequest BuildGcpApiPlatform(string suffix)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(suffix);

        return new ArchitectureRequest
        {
            RequestId = $"golden-cohort-gcp-{suffix}".ToLowerInvariant(),
            SystemName = $"GoldenCohort_Gcp_{suffix}",
            Description =
                "GCP API platform on GKE with Cloud SQL and Cloud Storage artifacts. Prefer private GKE nodes.",
            Environment = "prod",
            CloudProvider = CloudProvider.Gcp,
            Constraints = ["Golden cohort GCP regression", "No 0.0.0.0/0 firewall rules"],
            RequiredCapabilities = ["Container orchestration", "Managed SQL"],
        };
    }
}
