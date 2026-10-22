namespace ArchLucid.Contracts.ArchitectureIntelligence;

public class SourcePassageLocator
{
    public string ArtifactId
    {
        get;
        set;
    } = null!;

    public int? StartOffset
    {
        get;
        set;
    }

    public int? EndOffset
    {
        get;
        set;
    }

    public string? Quote
    {
        get;
        set;
    }

    public string? SectionPath
    {
        get;
        set;
    }
}
