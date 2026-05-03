namespace ArchLucid.Core.CustomerSuccess;

/// <summary>Materialized tenant health dimensions written by the scheduled scoring worker.</summary>
public sealed record TenantHealthScoreRecord(
    Guid TenantId,
    decimal EngagementScore,
    decimal BreadthScore,
    decimal QualityScore,
    decimal GovernanceScore,
    decimal SupportScore,
    decimal CompositeScore,
    DateTimeOffset UpdatedUtc);
