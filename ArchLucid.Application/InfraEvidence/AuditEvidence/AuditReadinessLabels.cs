namespace ArchLucid.Application.InfraEvidence.AuditEvidence;

/// <summary>User-facing labels for audit readiness (distinct from technical evaluation).</summary>
public static class AuditReadinessLabels
{
    public const string ReadinessHeading = "Audit readiness";

    public const string TechnicalEvaluationHeading = "Technical evaluation";

    public const string DefaultAggregateLabel = "Audit readiness summary";

    public const string ComplianceScoreLabel = "Compliance score";

    public static string ResolveAggregateLabel(bool catalogAllowsComplianceScoreAggregate) =>
        catalogAllowsComplianceScoreAggregate
            ? ComplianceScoreLabel
            : DefaultAggregateLabel;
}
