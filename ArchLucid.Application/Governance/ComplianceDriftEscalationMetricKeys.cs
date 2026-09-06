namespace ArchLucid.Application.Governance;

/// <summary>Canonical metric keys for <see cref="ComplianceDriftIntegrationEventPublishing" /> payloads.</summary>
public static class ComplianceDriftEscalationMetricKeys
{
    public const string OpenFindingsCount = "openFindingsCount";

    public const string PolicyPackStaleHours = "policyPackStaleHours";
}
