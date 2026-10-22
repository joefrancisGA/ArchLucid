namespace ArchLucid.Core.Ask;

public sealed class FindingAskRequest
{
    public Guid FindingId
    {
        get;
        set;
    }

    public string Question
    {
        get;
        set;
    } = string.Empty;

    public Guid? ThreadId
    {
        get;
        set;
    }
}
