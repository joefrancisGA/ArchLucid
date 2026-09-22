using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

/// <summary>
///     Guard wiring for wave-117 architecture create/review robustness suggestions 1389–1400.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ArchitectureReviewRobustnessWave117ArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Suggestion1389_1395_architecture_intelligence_read_and_mutation_sealed_manifest_mappers()
    {
        string productPublish = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.ProductPublish.cs"));
        string aiRun = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.Run.cs"));
        string aiGuard = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "ArchLucid.Api",
                "Controllers",
                "ArchitectureIntelligence",
                "ArchitectureIntelligenceController.SealedManifestGuard.cs"));

        productPublish.Should().Contain("GetProductRunSourceContextAsync");
        productPublish.Should().Contain("MapArchitectureIntelligenceSealedManifestConflict");
        aiRun.Should().Contain("PostRunAsync");
        aiRun.Should().Contain("PostContinueAsync");
        aiRun.Should().Contain("PostPublishAsync");
        aiRun.Should().Contain("GetRunModelAsync");
        aiRun.Should().Contain("MapArchitectureIntelligenceSealedManifestConflict");
        aiGuard.Should().Contain("EnsureRunSealedManifestReadAllowedAsync");
        aiGuard.Should().Contain("MapArchitectureIntelligenceSealedManifestConflict");
    }

    [Fact]
    public void Suggestion1396_1399_source_context_blocked_reason_and_query_wiring()
    {
        string aiBlockedReason = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "lib",
                "architecture",
                "architecture-intelligence-source-context-blocked-reason.ts"));
        string closedLoopApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-intelligence-api-closed-loop.ts"));
        string sourceContextQuery = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "hooks", "use-architecture-intelligence-source-context-query.ts"));
        string productContext = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architecture-intelligence",
                "_sections",
                "use-architecture-intelligence-product-context.ts"));

        aiBlockedReason.Should().Contain("architectureIntelligenceSourceContextBlockedReason");
        closedLoopApi.Should().Contain("fetchArchitectureIntelligenceProductSourceContext");
        closedLoopApi.Should().Contain("architectureIntelligenceSourceContextBlockedReason");
        sourceContextQuery.Should().Contain("architectureIntelligenceSourceContextBlockedReason");
        productContext.Should().Contain("architectureIntelligenceSourceContextBlockedReason");
    }

    [Fact]
    public void Suggestion1400_source_context_load_failure_callout_and_api_barrel()
    {
        string loadFailure = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architecture-intelligence",
                "_sections",
                "ArchitectureIntelligenceProductContextLoadFailure.tsx"));
        string aiApi = File.ReadAllText(
            Path.Combine(RepoRoot, "archlucid-ui", "src", "lib", "architecture", "architecture-intelligence-api.ts"));
        string pageClient = File.ReadAllText(
            Path.Combine(
                RepoRoot,
                "archlucid-ui",
                "src",
                "app",
                "(operator)",
                "architecture",
                "architecture-intelligence",
                "_sections",
                "ArchitectureIntelligencePageClient.tsx"));

        loadFailure.Should().Contain("architecture-intelligence-source-context-blocked-reason");
        aiApi.Should().Contain("architectureIntelligenceSourceContextBlockedReason");
        pageClient.Should().Contain("productContextBlockedReason");
    }
}
