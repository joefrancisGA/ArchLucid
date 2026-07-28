using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Deliberately incomplete architecture used by the golden closed-loop test (TB-1988 / LLM follow-on).
/// </summary>
public static class GoldenIncompleteArchitectureFixture
{
    public const string FileName = "golden-incomplete-architecture.md";

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
