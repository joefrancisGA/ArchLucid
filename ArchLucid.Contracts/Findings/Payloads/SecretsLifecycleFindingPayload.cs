namespace ArchLucid.Contracts.Findings.Payloads;

public class SecretsLifecycleFindingPayload
{
    public string SecretName
    {
        get;
        set;
    } = null!;

    public string VaultName
    {
        get;
        set;
    } = null!;

    public DateTimeOffset? LastRotatedUtc
    {
        get;
        set;
    }

    public int DaysStale
    {
        get;
        set;
    }

    public string Cloud
    {
        get;
        set;
    } = null!;
}
