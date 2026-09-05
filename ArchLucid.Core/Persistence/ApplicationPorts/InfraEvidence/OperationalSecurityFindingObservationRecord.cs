using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Persistence.InfraEvidence;

public sealed class OperationalSecurityFindingObservationRecord
{
    public Guid ObservationId
    {
        get;
        init;
    }

    public Guid FindingId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public DateTime ObservedUtc
    {
        get;
        init;
    }

    public OperationalSecurityFindingStatus Status
    {
        get;
        init;
    }

    public string? Severity
    {
        get;
        init;
    }

    public decimal? RiskScore
    {
        get;
        init;
    }

    public string? Summary
    {
        get;
        init;
    }

    public byte[] PayloadHashSha256
    {
        get;
        init;
    } = [];

    public string SourceSystem
    {
        get;
        init;
    } = string.Empty;
}
