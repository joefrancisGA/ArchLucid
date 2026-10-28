using System.Text.Json;
using ArchLucid.Application.CapacityPlanning;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Contracts.Persistence.Graph;

// Dedicated process and sanitized, generated documents; exercises real retrieval chunkers.
if (args.Length != 4 || !new[] { "document-ingestion", "retrieval", "graph-analysis", "graph-dense", "graph-branching" }.Contains(args[0]) ||
    !int.TryParse(args[1], out int size) || size is < 100 or > 10000 ||
    string.IsNullOrWhiteSpace(args[2]) || string.IsNullOrWhiteSpace(args[3]))
{
    Console.Error.WriteLine("Usage: <document-ingestion|retrieval|graph-analysis> <size 100..10000> <revision> <output-json>");
    return 2;
}
string workload = args[0], revision = args[2], path = args[3];
// Build deterministic inputs before measuring, to exclude fixture generation cost.
string document = string.Concat(Enumerable.Range(0, size)
    .Select(i => $"# Section {i}\n\nArchitecture component {i} provides deterministic scoped processing.\n\n"));
ITextChunker? chunker = workload switch
{
    "document-ingestion" => new StructureAwareTextChunker(),
    "retrieval" => new SimpleTextChunker(),
    _ => null
};
GraphSnapshot? graph = workload.StartsWith("graph-", StringComparison.Ordinal) ? new GraphSnapshot
{
    Nodes = Enumerable.Range(0, size).Select(i => new GraphNode
    { NodeId = i.ToString(), NodeType = "Component", Label = $"Component {i}" }).ToList(),
    Edges = (workload switch
    {
        "graph-dense" => Enumerable.Range(0, Math.Min(size, 100))
            .SelectMany(i => Enumerable.Range(0, Math.Min(size, 100))
                .Where(j => j != i).Select(j => (From: i, To: j))),
        "graph-branching" => Enumerable.Range(0, size)
            .SelectMany(i => Enumerable.Range(1, 8)
                .Where(offset => i + offset < size).Select(offset => (From: i, To: i + offset))),
        _ => Enumerable.Range(0, size - 1).Select(i => (From: i, To: i + 1))
    }).Select((edge, index) => new GraphEdge
    { EdgeId = $"edge-{index}", FromNodeId = edge.From.ToString(),
      ToNodeId = edge.To.ToString(), EdgeType = "ConnectedTo" }).ToList()
} : null;
var sample = await IsolatedWorkloadBenchmark.MeasureAsync(revision, workload, size, ct =>
{
    ct.ThrowIfCancellationRequested();
    if (chunker is not null)
    {
        IReadOnlyList<string> chunks = chunker.Chunk(document, 1200, 150);
        if (chunks.Count == 0) throw new InvalidOperationException("Expected chunks");
        GC.KeepAlive(chunks);
    }
    else
    {
        // Exercises the actual bounded traversal implementation on a sanitized graph.
        int neighbors = GraphRagTraversalBenchmarkAdapter.CountNeighbors(
            graph!, "0", maxHops: 4, maxNeighbors: Math.Min(size - 1, 1000));
        if (neighbors <= 0) throw new InvalidOperationException("Expected graph neighbors");
        GC.KeepAlive(neighbors);
    }
    return Task.CompletedTask;
}, TimeSpan.FromMilliseconds(10), dedicatedProcessConfirmed: true);
var result = new
{
    schemaVersion = 1, fixtureVersion = "retrieval-graph-topologies-v4",
    runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
    processorCount = Environment.ProcessorCount,
    workload, size, sample,
    limitation = "Sanitized generated text; document and retrieval cohorts use real ArchLucid chunkers only. No embedding, indexing, SQL or end-to-end ingestion. Graph cohorts invoke the real bounded GraphRAG collector on generated chain, dense and branching topologies; no graph repository or full retrieval pipeline. Sampled memory is not peak."
};
Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
await File.WriteAllTextAsync(path, JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }));
return 0;
