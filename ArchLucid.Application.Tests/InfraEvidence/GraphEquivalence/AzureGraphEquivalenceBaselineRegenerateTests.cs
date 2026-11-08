using System.Text.Json;
using System.Text.Json.Nodes;
using FluentAssertions;
using Xunit;
using ArchLucid.Application.InfraEvidence.Mermaid;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;
using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence.GraphEquivalence;

[Trait("Category", "Unit")]
public sealed class AzureGraphEquivalenceBaselineRegenerateTests
{
    [Fact]
    public async Task Regenerate_master_baseline_when_env_set()
    {
        string? flag = Environment.GetEnvironmentVariable("ARCHLUCID_REGENERATE_GRAPH_EQUIVALENCE");
        if (!string.Equals(flag, "1", StringComparison.Ordinal))
            return;

        Dictionary<string, JsonElement> cases = await CaptureAllCasesAsync();
        string baselinePath = LocateBaselineFile();

        JsonNode root = JsonNode.Parse(await File.ReadAllTextAsync(baselinePath))!;
        JsonObject casesNode = root["cases"]!.AsObject();
        foreach ((string name, JsonElement capture) in cases)
        {
            casesNode[name] = JsonNode.Parse(JsonSerializer.Serialize(capture))!;
        }

        await File.WriteAllTextAsync(
            baselinePath,
            root.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
        File.Exists(baselinePath).Should().BeTrue();
    }

    private static string LocateBaselineFile()
    {
        for (DirectoryInfo? directory = new(AppContext.BaseDirectory); directory is not null; directory = directory.Parent)
        {
            string candidate = Path.Combine(
                directory.FullName,
                "InfraEvidence",
                "GraphEquivalence",
                "master-3c0c4fd9.json");
            if (File.Exists(candidate))
                return candidate;

            candidate = Path.Combine(
                directory.FullName,
                "ArchLucid.Application.Tests",
                "InfraEvidence",
                "GraphEquivalence",
                "master-3c0c4fd9.json");
            if (File.Exists(candidate))
                return candidate;
        }

        throw new FileNotFoundException("Could not locate master-3c0c4fd9.json from test base directory.");
    }

    private static async Task<Dictionary<string, JsonElement>> CaptureAllCasesAsync()
    {
        Dictionary<string, JsonElement> cases = new(StringComparer.Ordinal);

        foreach (AzureGraphEquivalenceCase fixture in AzureGraphEquivalenceFixtures.All())
        {
            GraphSnapshot graph = await ResolveAsync(fixture);
            cases[fixture.Name] = AzureGraphSemanticCapture.Capture(graph);
        }

        return cases;
    }

    private static async Task<GraphSnapshot> ResolveAsync(AzureGraphEquivalenceCase fixture)
    {
        Mock<IAzureInventorySnapshotRepository> repository = new(MockBehavior.Strict);
        repository.Setup(candidate => candidate.TryGetCanonicalSnapshotDetailAsync(It.IsAny<ScopeContext>(),
            fixture.Snapshot.Header.SnapshotId, It.IsAny<CancellationToken>())).ReturnsAsync(fixture.Snapshot);
        AzureInventorySnapshotGraphResolveResult result = await new AzureInventorySnapshotGraphResolver(repository.Object)
            .TryResolveGraphAsync(new ScopeContext
            {
                TenantId = fixture.Snapshot.Header.TenantId,
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            }, fixture.Snapshot.Header.SnapshotId, includeNeverShowArmTypes: fixture.IncludeHidden);
        if (!result.Succeeded || result.Graph is null)
            throw new InvalidOperationException($"Fixture {fixture.Name} failed to resolve.");

        return result.Graph;
    }
}
