namespace ArchLucid.Persistence.InfraEvidence;

public sealed class RemediationPrioritizationWeightsRecord
{
    public Guid TenantId
    {
        get;
        init;
    }

    public string WeightsJson
    {
        get;
        init;
    } = string.Empty;

    public string UpdatedByActorKey
    {
        get;
        init;
    } = string.Empty;

    public DateTime UpdatedUtc
    {
        get;
        init;
    }
}
