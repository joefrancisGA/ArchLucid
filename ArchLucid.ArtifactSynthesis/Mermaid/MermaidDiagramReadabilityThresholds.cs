namespace ArchLucid.ArtifactSynthesis.Mermaid;

/// <summary>Readable diagram thresholds (IE-17). An 8k-node full graph must not return <see cref="MermaidDiagramRenderStatus.Succeeded" />.</summary>
public sealed class MermaidDiagramReadabilityThresholds
{
    public int MaxNodes
    {
        get;
        init;
    } = 400;

    public int MaxEdges
    {
        get;
        init;
    } = 800;

    public int MaxSubgraphs
    {
        get;
        init;
    } = 64;

    public int MaxMaxDegree
    {
        get;
        init;
    } = 48;

    public int MaxCrossSubgraphEdges
    {
        get;
        init;
    } = 200;

    public int MaxTextSizeBytes
    {
        get;
        init;
    } = 512_000;

    public int MaxLayoutEstimate
    {
        get;
        init;
    } = 250_000;
}
