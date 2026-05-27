namespace ArchLucid.Contracts.Governance;

/// <summary>Lifecycle of a governed risk exception (waiver).</summary>
public enum RiskExceptionStatus
{
    Active = 0,
    Revoked = 1,
    Expired = 2,
}
