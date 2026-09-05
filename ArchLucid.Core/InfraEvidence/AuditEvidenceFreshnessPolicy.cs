namespace ArchLucid.Core.InfraEvidence;

/// <summary>Parsed freshness thresholds from an imported requirement's RequiredFreshness field.</summary>
public sealed class AuditEvidenceFreshnessPolicy
{
    public int FreshDays
    {
        get;
        init;
    }

    public int StaleDays
    {
        get;
        init;
    }

    public int ExpireDays
    {
        get;
        init;
    }

    public bool IsParseable
    {
        get;
        init;
    }
}
