namespace ArchLucid.Contracts.Findings;

/// <summary>ADR 0062 per-finding verification outcome.</summary>
public enum FindingVerificationStatus : byte
{
    Materialized = 0,

    Mitigated = 1,

    NotObserved = 2,

    NotVerifiable = 3,
}
