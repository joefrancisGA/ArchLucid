using FluentAssertions;

namespace ArchLucid.Architecture.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class DiagramImportComparisonArchitectureTests
{
    private static string RepoRoot =>
        Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));

    [Fact]
    public void Run_linked_reconciliation_keeps_sealed_manifest_guard()
    {
        string reconciliationService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "DiagramInfrastructureReconciliationService.cs"));
        string advisoryService = File.ReadAllText(
            Path.Combine(RepoRoot, "ArchLucid.Application", "InfraEvidence", "InfrastructureDiagramComparisonService.cs"));

        reconciliationService.Should().Contain("DiagramInfrastructureReconciliationSealedManifestHashGuard");
        advisoryService.Should().NotContain("DiagramInfrastructureReconciliationSealedManifestHashGuard");
    }
}
