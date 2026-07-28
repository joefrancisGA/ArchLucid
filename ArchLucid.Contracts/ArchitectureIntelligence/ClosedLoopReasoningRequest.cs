namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class ClosedLoopReasoningRequest
{
    public string TenantId
    {
        get;
        set;
    } = null!;

    public string? RunId
    {
        get;
        set;
    }

    public string? WorkspaceId
    {
        get;
        set;
    }

    public string? ProjectId
    {
        get;
        set;
    }

    public List<ClosedLoopReasoningSourceText> SourceTexts
    {
        get;
        set;
    } = [];

    public List<string> DeclaredPriorities
    {
        get;
        set;
    } = [];
}
