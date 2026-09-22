namespace ArchLucid.Persistence.InfraEvidence;

public sealed class AzureInventoryDefenderSummaryWrite
{
    public string ResourceId
    {
        get;
        init;
    } = string.Empty;

    public int SecureScore
    {
        get;
        init;
    }

    public string? SourceEvidenceReference
    {
        get;
        init;
    }
}
