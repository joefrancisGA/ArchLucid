namespace ArchLucid.Persistence.InfraEvidence;

public sealed class RemediationWaveMemberRecord
{
    public Guid MemberId
    {
        get;
        init;
    }

    public Guid WaveId
    {
        get;
        init;
    }

    public Guid TenantId
    {
        get;
        init;
    }

    public Guid FindingId
    {
        get;
        init;
    }

    public Guid? InstanceId
    {
        get;
        init;
    }

    public Guid? CloudResourceId
    {
        get;
        init;
    }

    public int PriorityRank
    {
        get;
        init;
    }

    public decimal PriorityScore
    {
        get;
        init;
    }

    public DateTime CreatedUtc
    {
        get;
        init;
    }
}
