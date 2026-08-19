namespace ArchLucid.Decisioning.Analysis;

public sealed class RequirementTraceabilityGap
{
    public required string GapCode
    {
        get;
        init;
    }

    public required string Title
    {
        get;
        init;
    }

    public required string Rationale
    {
        get;
        init;
    }

    public required string Description
    {
        get;
        init;
    }

    public required string Impact
    {
        get;
        init;
    }

    public IReadOnlyList<string> RelatedNodeIds
    {
        get;
        init;
    } = [];
}
