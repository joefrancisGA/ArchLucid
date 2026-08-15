using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Deliberately incomplete architecture used by the golden closed-loop test (TB-1988).
/// </summary>
public static class GoldenIncompleteArchitectureFixture
{
    public const string FileName = "golden-incomplete-architecture.md";
    public const string DeepCaseId = "deep-golden-incomplete";

    public const string Content = """
        # Claims intake service (incomplete draft)

        Business outcome: process insurance claims submissions for US customers.

        Components:
        - Public HTTPS API (no authentication described)
        - Billing worker (no operational owner)
        - SQL database with nightly full backups only

        Stated recovery objective: RTO 30 minutes.
        Documented backup interval: 4 hours (no transaction-log / PITR evidence).

        Data: customer PII may be stored. No trust boundary diagram provided.
        Deployment: single region, Azure App Service mentioned without labeling cloud-neutrality assumptions.
        Cost priority is secondary to security for this workload.
        """;

    public static IReadOnlyList<PlantedDefectExpectation> ExpectedPlantedDefects { get; } =
    [
        new PlantedDefectExpectation
        {
            DefectId = "public-api-no-auth",
            TitlePattern = "public",
            Dimension = QualityDimension.Security,
            MinSeverity = "High",
        },
        new PlantedDefectExpectation
        {
            DefectId = "missing-trust-boundary",
            TitlePattern = "trust boundary",
            Dimension = QualityDimension.Security,
            MinSeverity = "High",
        },
        new PlantedDefectExpectation
        {
            DefectId = "unowned-billing-worker",
            TitlePattern = "owner",
            Dimension = QualityDimension.Cost,
            MinSeverity = "Medium",
        },
        new PlantedDefectExpectation
        {
            DefectId = "rto-backup-mismatch",
            TitlePattern = "recovery",
            Dimension = QualityDimension.Reliability,
            MinSeverity = "Medium",
        },
    ];

    public static ClosedLoopReasoningRequest CreateRequest(string tenantId)
    {
        if (string.IsNullOrWhiteSpace(tenantId))
        {
            throw new ArgumentException("TenantId is required.", nameof(tenantId));
        }

        return new ClosedLoopReasoningRequest
        {
            TenantId = tenantId,
            DeclaredPriorities = ["Security", "Reliability", "Cost"],
            FramingAnswers = new Dictionary<string, string>(StringComparer.Ordinal)
            {
                ["business-outcome"] = "Process insurance claims submissions for US customers.",
                ["system-boundary"] =
                    "Public API, billing worker, and SQL database are in scope; external identity provider is out of scope.",
                ["fixed-decisions"] = "Azure App Service hosting is fixed.",
                ["critical-quality-attributes"] = "Security is critical; cost is secondary.",
                ["unacceptable-failures"] =
                    "Customer PII breach and inability to process claims are unacceptable.",
                ["architecture-kind"] = "Greenfield claims intake service.",
            },
            SourceTexts =
            [
                new ClosedLoopReasoningSourceText
                {
                    FileName = FileName,
                    ContentType = "text/markdown",
                    Content = Content,
                },
            ],
        };
    }
}
