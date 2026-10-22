namespace ArchLucid.Contracts.Admin;

public sealed class TenantAzureOpenAiConnectionProbeResponse
{
    public bool Succeeded
    {
        get;
        init;
    }

    public string Message
    {
        get;
        init;
    } = "";
}
