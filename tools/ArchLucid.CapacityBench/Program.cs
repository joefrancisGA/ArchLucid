using System.Text.Json;
using ArchLucid.Application.CapacityPlanning;

// One invocation = one short-lived process. No shared host, tenants, credentials or network.
if (args.Length != 4 || !new[] { "document-ingestion", "retrieval", "graph-analysis" }.Contains(args[0]) ||
    !int.TryParse(args[1], out int size) || size is < 100 or > 10000 ||
    string.IsNullOrWhiteSpace(args[2]) || string.IsNullOrWhiteSpace(args[3]))
{
    Console.Error.WriteLine("Usage: <document-ingestion|retrieval|graph-analysis> <size 100..10000> <revision> <output-json>");
    return 2;
}
string workload = args[0], revision = args[2], path = args[3];
var sample = await IsolatedWorkloadBenchmark.MeasureAsync(revision, workload, size, ct =>
{
    // Deterministic, synthetic, CPU-focused workload fixture. No production analysis logic.
    long checksum = 0;
    for (int i = 0; i < size; i++)
    {
        ct.ThrowIfCancellationRequested();
        string input = $"{workload}:{i:D8}:{i * 17L:D12}";
        if (workload == "document-ingestion")
            checksum += System.Text.Encoding.UTF8.GetByteCount(input);
        else if (workload == "retrieval")
            checksum += string.CompareOrdinal(input, "retrieval:00001000:000000017000");
        else
            checksum += (i * 31L) % 997;
    }
    GC.KeepAlive(checksum);
    return Task.CompletedTask;
}, TimeSpan.FromMilliseconds(10), dedicatedProcessConfirmed: true);
var result = new
{
    schemaVersion = 1, fixtureVersion = "synthetic-capacity-v1",
    runtime = System.Runtime.InteropServices.RuntimeInformation.FrameworkDescription,
    processorCount = Environment.ProcessorCount,
    workload, size, sample,
    limitation = "Synthetic microbenchmark in a dedicated process; sampled working set is not peak; not real product workload or production calibration."
};
Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
await File.WriteAllTextAsync(path, JsonSerializer.Serialize(result, new JsonSerializerOptions { WriteIndented = true }));
return 0;
