using ArchLucid.KnowledgeGraph.Models;

namespace ArchLucid.Decisioning.Tests.GoldenCorpus;

/// <summary>Pinned prior graph snapshot for cross-run engines (case-64 topology-security-drift).</summary>
public sealed class GoldenCorpusPriorGraphFixtureDocument
{
    public Guid PriorRunId
    {
        get; set;
    }

    public Guid PriorGraphSnapshotId
    {
        get; set;
    }

    public GraphSnapshot PriorGraphSnapshot
    {
        get; set;
    } = new();
}
