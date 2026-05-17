using System.Text.Json;

using ArchLucid.Application.Bootstrap;
using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Bootstrap;

/// <summary>
/// Keeps <c>fixtures/demo-workspaces/demo-workspaces.fixture.manifest.json</c>, SQL seed builders, and
/// <see cref="DemoWorkspaceStableIds"/> aligned — consumed by Playwright + doc guards + release-smoke validation.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DemoWorkspaceFixtureManifestParityTests
{
    private static readonly JsonSerializerOptions SerializerOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
        PropertyNameCaseInsensitive = true,
    };

    [Fact]
    public void Pinned_manifest_matches_DemoWorkspaceStableIds_and_seed_builder_counts()
    {
        DemoFixtureManifest manifest = ReadManifest();

        manifest.DefaultTenantId.Should().Be(ScopeIds.DefaultTenant.ToString("D"));

        Guid aRun = Guid.Parse(manifest.WorkspaceA.RunId);

        aRun.Should().Be(DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId);
        Guid.Parse(manifest.WorkspaceA.WorkspaceId).Should().Be(DemoWorkspaceStableIds.ProductTourWorkspaceId);
        Guid.Parse(manifest.WorkspaceA.ProjectId).Should().Be(DemoWorkspaceStableIds.ProductTourProjectScopeId);

        Guid bRun = Guid.Parse(manifest.WorkspaceB.RunId);

        bRun.Should().Be(DemoWorkspaceStableIds.RegulatedScenarioArchitectureReviewRunId);
        Guid.Parse(manifest.WorkspaceB.WorkspaceId).Should().Be(DemoWorkspaceStableIds.RegulatedScenarioWorkspaceId);
        Guid.Parse(manifest.WorkspaceB.ProjectId).Should().Be(DemoWorkspaceStableIds.RegulatedScenarioProjectScopeId);

        ProductTourWorkspaceSeed.BuildFindings(aRun)
            .Should()
            .HaveCount(manifest.WorkspaceA.ExpectedCommittedFindingCount);

        ProductTourWorkspaceSeed.BuildSyntheticEvidenceObjects(aRun)
            .Should()
            .HaveCount(manifest.WorkspaceA.SeedSyntheticEvidenceObjectCount);

        RegulatedScenarioWorkspaceSeed.BuildFindings(bRun)
            .Should()
            .HaveCount(manifest.WorkspaceB.ExpectedCommittedFindingCount);

        RegulatedScenarioWorkspaceSeed.BuildSyntheticEvidenceObjects(bRun)
            .Should()
            .HaveCount(manifest.WorkspaceB.SeedSyntheticEvidenceObjectCount);
    }

    private static DemoFixtureManifest ReadManifest()
    {
        string path = Path.Combine(AppContext.BaseDirectory, "demo-workspaces", "demo-workspaces.fixture.manifest.json");

        File.Exists(path).Should().BeTrue($"manifest missing at {path} — ensure csproj copies fixtures/demo-workspaces.");

        string json = File.ReadAllText(path);

        return JsonSerializer.Deserialize<DemoFixtureManifest>(json, SerializerOptions)
               ?? throw new InvalidOperationException("Fixture manifest deserialized to null.");
    }

    private sealed class DemoFixtureManifest
    {
        public string DefaultTenantId { get; init; } = "";

        public DemoFixtureWorkspace WorkspaceA { get; init; } = null!;

        public DemoFixtureWorkspace WorkspaceB { get; init; } = null!;
    }

    private sealed class DemoFixtureWorkspace
    {
        public string RunId { get; init; } = "";

        public string WorkspaceId { get; init; } = "";

        public string ProjectId { get; init; } = "";

        public int ExpectedCommittedFindingCount { get; init; }

        public int SeedSyntheticEvidenceObjectCount { get; init; }
    }
}
