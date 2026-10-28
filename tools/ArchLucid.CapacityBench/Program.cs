using System.Text.Json;
using ArchLucid.Application.CapacityPlanning;
using ArchLucid.Retrieval.Chunking;
using ArchLucid.Retrieval.Graph;
using ArchLucid.Contracts.Persistence.Graph;

// Dedicated process and sanitized, generated documents; exercises real retrieval chunkers.
if (args.Length != 4 || !new[] { "document-ingestion", "retrieval", "graph-analysis" }.Contains(args[0]) ||
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
GraphSnapshot? graph = workload == "graph-analysis" ? new GraphSnapshot
{
    Nodes = Enumerable.Range(0, size).Select(i => new GraphNode
    { NodeId = i.ToString(), NodeType = "Component", Label = $"Component {i}" }).ToList(),
    Edges = Enumerable.Range(0, size - 1).Select(i => new GraphEdge
    { EdgeId = $"edge-{i}", FromNodeId = i.ToString(), ToNodeId = (i + 1).ToString(),
      EdgeType = "ConnectedTo" }).ToList()
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
    schemaVersion = 1, fixtureVersion = "retrieval-graph-component-v3",
    runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
    processorCount = Environment.ProcessorCount,
    workload, size, sample,
    limitation = "Sanitized generated text; document and retrieval cohorts use real ArchLucid chunkers only. No embedding, indexing, SQL or end-to-end ingestion. Graph cohort invokes the real bounded GraphRAG collector on generated chain topology; no graph repository or full retrieval pipeline. Sampled memory is not peak."
};
Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
await File.WriteAllTextAsync(path, JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }));
return 0;
