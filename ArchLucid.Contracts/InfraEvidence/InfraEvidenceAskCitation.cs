namespace ArchLucid.Contracts.InfraEvidence;

public sealed class InfraEvidenceAskCitation
{
    public string Kind
    {
        get;
        set;
    } = string.Empty;

    public string Id
    {
        get;
        set;
    } = string.Empty;

    public string? Label
    {
        get;
        set;
    }
}
