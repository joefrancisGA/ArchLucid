namespace ArchLucid.Core.InfraEvidence;

/// <summary>Freshness classification for collected audit evidence. AE-05 computes non-Unknown values.</summary>
public enum AuditEvidenceFreshnessStatus
{
    Unknown = 0,
    Current = 1,
    Fresh = 2,
    Aging = 3,
    Stale = 4,
    Expired = 5,
}
