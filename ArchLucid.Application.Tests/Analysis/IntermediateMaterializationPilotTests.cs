using System.Diagnostics;
using System.Globalization;
using System.Security.Cryptography;
using System.Text.Json;

using ArchLucid.Application.Analysis;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Persistence.Graph;
using ArchLucid.Core.Persistence.Serialization;
using ArchLucid.Core.Scoping;
using ArchLucid.KnowledgeGraph.Serialization;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.InfraEvidence;
using ArchLucid.Persistence.Orchestration.AnalysisRecovery;

using Moq;

using Xunit.Abstractions;

namespace ArchLucid.Application.Tests.Analysis;

/// <summary>Measures synthetic projections against the existing codec and local artifact store. Timings never gate CI.</summary>
[Trait("Category", "Slow")]
[Trait("Suite", "Application")]
public sealed class IntermediateMaterializationPilotTests(ITestOutputHelper output)
{
    private static readonly Guid FixtureId = new("10000000-0000-4000-8000-000000000001");
    private static readonly DateTime CapturedUtc = new(2026, 11, 22, 12, 0, 0, DateTimeKind.Utc);
    private const string Container = "fnd085-synthetic-pilot";
    private const int MeasuredIterations = 9;

    [Theory]
    [InlineData(false, 256)]
    [InlineData(false, 2048)]
    [InlineData(true, 256)]
    [InlineData(true, 2048)]
    public async Task Profile_projection_recomputation_and_validated_artifact_reads(bool secureNow, int nodes)
    {
        ScopeContext scope = new() { TenantId = FixtureId, WorkspaceId = FixtureId, ProjectId = FixtureId };
        IScopeContextProvider scopeProvider = Mock.Of<IScopeContextProvider>(p => p.GetCurrentScope() == scope);
        string root = Directory.CreateTempSubdirectory("fnd085-artifact-").FullName;

        try
        {
            IArtifactBlobStore store = new LocalFileArtifactBlobStore(root, scopeProvider);
            Func<GraphSnapshot> recompute = secureNow ? SecureNowProjection(scope, nodes) : AuthorityMerge(nodes);
            GraphSnapshot expected = recompute();
            Assert.Equal(nodes, expected.Nodes.Count);
            byte[] expectedBytes = GraphJsonSerialization.SerializeSnapshotToUtf8Bytes(expected);
            Assert.Equal(expectedBytes, GraphJsonSerialization.SerializeSnapshotToUtf8Bytes(recompute()));

            double[] recomputeMs = new double[MeasuredIterations];
            double[] writeMs = new double[MeasuredIterations];
            double[] readMs = new double[MeasuredIterations];
            int storedBytes = 0;
            string workload = secureNow ? "securenow-inventory-diagram-projection" : "authority-knowledge-graph-merge";

            AnalysisRecoveryStageKey stage = new(ProjectScopeKey.From(scope), workload, FixtureId, "projection");
            DateTimeOffset now = new(CapturedUtc);
            const string InputVersion = "synthetic-input-v1";
            const string ProducerVersion = "projection-pilot-v1";
            const long MaxBytes = 4 * 1024 * 1024;

            for (int i = -1; i < MeasuredIterations; i++)
            {
                long start = Stopwatch.GetTimestamp();
                GraphSnapshot computed = recompute();
                double cold = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
                start = Stopwatch.GetTimestamp();
                byte[] payload = GraphSnapshotMessagePackSerialization.SerializeSnapshot(computed);
                var reference = new OptionalIntermediateArtifact.Reference(stage, InputVersion, ProducerVersion,
                    Convert.ToHexString(SHA256.HashData(payload)), payload.Length, OptionalIntermediateArtifact.FormatVersion,
                    now.AddHours(1));
                string encoded = Convert.ToBase64String(payload);
                string uri = await store.WriteAsync(Container, $"{i}.v1", encoded, CancellationToken.None);
                double write = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
                start = Stopwatch.GetTimestamp();
                string? stored = await store.ReadAsync(uri, CancellationToken.None);
                Assert.NotNull(stored);
                byte[] bytes = Convert.FromBase64String(stored);
                OptionalIntermediateArtifact.Disposition validity = OptionalIntermediateArtifact.Validate(reference, stage,
                    InputVersion, ProducerVersion, bytes, MaxBytes, now);
                GraphSnapshot? loaded = validity == OptionalIntermediateArtifact.Disposition.Usable
                    ? GraphSnapshotMessagePackSerialization.DeserializeSnapshot(bytes)
                    : null;
                double read = Stopwatch.GetElapsedTime(start).TotalMilliseconds;
                Assert.Equal(OptionalIntermediateArtifact.Disposition.Usable, validity);
                Assert.NotNull(loaded);
                Assert.Equal(expectedBytes, GraphJsonSerialization.SerializeSnapshotToUtf8Bytes(loaded));
                storedBytes = encoded.Length;

                if (i >= 0)
                {
                    recomputeMs[i] = cold;
                    writeMs[i] = write;
                    readMs[i] = read;
                }
            }

            double computeMedian = Median(recomputeMs);
            double readMedian = Median(readMs);
            double writeMedian = Median(writeMs);
            var report = new
            {
                schemaVersion = 1,
                workload,
                nodes,
                storedBytes,
                iterations = MeasuredIterations,
                computeMedian,
                readMedian,
                writeMedian,
                optimisticBreakEvenHits = computeMedian > readMedian
                    ? (double?)(writeMedian / (computeMedian - readMedian))
                    : null,
                limitation = "Synthetic, local file provider, warmed process. No SQL/remote storage cost or observed reuse."
            };
            string json = JsonSerializer.Serialize(report);
            output.WriteLine(json);
            string? outputDirectory = Environment.GetEnvironmentVariable("FND085_PILOT_OUTPUT_DIR");

            if (!string.IsNullOrWhiteSpace(outputDirectory))
            {
                Directory.CreateDirectory(outputDirectory);
                await File.WriteAllTextAsync(Path.Combine(outputDirectory, $"{workload}-{nodes}.json"), json);
            }
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }

    private static double Median(double[] samples) => samples.Order().ElementAt(samples.Length / 2);

    private static Func<GraphSnapshot> AuthorityMerge(int count)
    {
        GraphSnapshot context = new()
        {
            Nodes = Enumerable.Range(0, count).Select(i => new GraphNode
            {
                NodeId = $"component-{i}",
                NodeType = "service",
                Label = $"Component {i}",
            }).ToList(),
            Edges = Enumerable.Range(1, count - 1).Select(i => new GraphEdge
            {
                EdgeId = $"edge-{i}",
                FromNodeId = $"component-{i - 1}",
                ToNodeId = $"component-{i}",
                EdgeType = "depends-on",
            }).ToList(),
        };
        GraphSnapshot model = new()
        {
            GraphSnapshotId = FixtureId,
            ContextSnapshotId = FixtureId,
            RunId = FixtureId,
            CreatedUtc = CapturedUtc,
            Nodes = [.. context.Nodes.Where((_, i) => i % 2 == 0)],
        };
        return () => GraphSnapshotKnowledgeModelMerger.Merge(context, model);
    }

    private static Func<GraphSnapshot> SecureNowProjection(ScopeContext scope, int count)
    {
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = new AzureInventorySnapshotRecord
            {
                SnapshotId = FixtureId,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                CapturedUtc = CapturedUtc,
            },
            Resources = Enumerable.Range(0, count).Select(i => new AzureInventoryResourceRecord
            {
                SnapshotId = FixtureId,
                TenantId = scope.TenantId,
                AzureResourceId = "/subscriptions/synthetic/resourceGroups/diagram/providers/Microsoft.Compute/virtualMachines/component-"
                    + i.ToString(CultureInfo.InvariantCulture),
                ResourceType = "Microsoft.Compute/virtualMachines",
                ResourceGroup = "diagram",
                SubscriptionId = "synthetic",
            }).ToList(),
        };
        AzureInventorySnapshotGraphResolver resolver = new(Mock.Of<IAzureInventorySnapshotRepository>());
        return () => resolver.ResolveGraphFromSnapshot(snapshot).Graph!;
    }
}
