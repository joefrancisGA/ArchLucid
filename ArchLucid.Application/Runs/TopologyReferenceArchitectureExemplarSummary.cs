namespace ArchLucid.Application.Runs;

/// <summary>Topology reference-architecture style-prior rollup for operator run detail (TB-663).</summary>
public sealed class TopologyReferenceArchitectureExemplarSummary
{
    public int ExemplarCount
    {
        get;
        init;
    }

    public IReadOnlyList<string> ExemplarDocumentIds
    {
        get;
        init;
    } = [];

    public bool ExemplarMissing
    {
        get;
        init;
    }
}
