namespace ArchLucid.ArtifactSynthesis.Models;

public sealed class DiagramAstCompileOptions
{
    public string? ResourceGroupName
    {
        get;
        init;
    }

    public IReadOnlyList<string>? SelectedNodeIds
    {
        get;
        init;
    }

    public string? NeighborhoodSeedNodeId
    {
        get;
        init;
    }

    public int NeighborhoodDepth
    {
        get;
        init;
    } = 2;
}
