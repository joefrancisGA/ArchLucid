using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Findings;

namespace ArchLucid.Application.Architecture;

/// <summary>Static demonstration result available when AI execution is disabled or capacity is exhausted.</summary>
public static class QuickScanSampleResultProvider
{
    public const string DemonstrationDisclaimer =
        "This is a demonstration result. It illustrates the kind of concise architecture feedback Quick Scan provides and is not a saved workspace review or a complete ArchLucid assessment.";

    public static ArchitectureQuickScanResponse Build()
    {
        return new ArchitectureQuickScanResponse
        {
            ScanId = "sample-quick-scan",
            SystemName = "Claims intake API",
            PrimaryEnvironment = QuickScanPrimaryEnvironment.Azure,
            Summary =
                "The described workload shows a conventional three-tier pattern with clear external boundaries, but several controls need tightening before production scale.",
            Findings =
            [
                new ArchitectureQuickScanFindingItem
                {
                    Title = "Identity and access boundaries",
                    Description =
                        "Service principals and human operators should use separate roles with least privilege. Review token lifetimes and rotation for APIs exposed to partners.",
                    Severity = FindingSeverity.Critical,
                    ConfidenceScore = 0.74,
                    ConfidenceLevel = FindingConfidenceLevel.Medium,
                },
                new ArchitectureQuickScanFindingItem
                {
                    Title = "Network segmentation",
                    Description =
                        "Keep internal APIs and data stores on private endpoints. Deny-by-default ingress and explicit egress allow lists reduce lateral movement risk.",
                    Severity = FindingSeverity.Error,
                    ConfidenceScore = 0.69,
                    ConfidenceLevel = FindingConfidenceLevel.Medium,
                },
                new ArchitectureQuickScanFindingItem
                {
                    Title = "Data protection",
                    Description =
                        "Encrypt sensitive data at rest and in transit. Document key custody and whether backups are isolated from production credentials.",
                    Severity = FindingSeverity.Warning,
                    ConfidenceScore = 0.8,
                    ConfidenceLevel = FindingConfidenceLevel.High,
                },
            ],
            PositiveObservations =
            [
                "The architecture separates user-facing APIs from internal processing, which limits direct exposure of core services.",
                "Managed platform services reduce undifferentiated operational toil compared with self-hosted alternatives.",
            ],
            RecommendedNextSteps =
            [
                "Run a full ArchLucid workspace review with evidence from diagrams, policies, and integration metadata.",
                "Validate disaster recovery and observability coverage for the highest-risk data paths.",
                "Request a guided demonstration if procurement needs a deeper walkthrough.",
            ],
            CompletedUtc = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            IsSampleResult = true,
            DemonstrationDisclaimer = DemonstrationDisclaimer,
        };
    }
}
