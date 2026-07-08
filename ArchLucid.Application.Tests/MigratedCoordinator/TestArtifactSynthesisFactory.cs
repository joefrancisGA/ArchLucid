using ArchLucid.ArtifactSynthesis.Generators;
using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Costing;
using ArchLucid.ArtifactSynthesis.Renderers;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Tests.MigratedCoordinator;

internal static class TestArtifactSynthesisFactory
{
    public static IArtifactSynthesisService Create()
    {
        MermaidDiagramRenderer renderer = new();
        IEnumerable<IArtifactGenerator> generators =
        [
            new ReferenceArchitectureMarkdownGenerator(),
            new ArchitectureNarrativeArtifactGenerator(),
            new ComplianceMatrixArtifactGenerator(),
            new CoverageSummaryArtifactGenerator(),
            new DiagramAstGenerator(),
            new MermaidDiagramArtifactGenerator(renderer),
            new InventoryArtifactGenerator(),
            new CostSummaryArtifactGenerator(new IllustrativeOnlyInfrastructureCostArtifactAugmentationProvider(null)),
            new TerraformAdvisoryArtifactGenerator(CompositeTerraformValidator.Instance),
            new UnresolvedIssuesArtifactGenerator()
        ];
        return new ArtifactSynthesisService(
            generators,
            new ArtifactBundleValidator(),
            new TechnologyLedgerArtifactLinter(),
            Options.Create(new TechnologyLedgerArtifactLintOptions { Enabled = false }),
            NullLogger<ArtifactSynthesisService>.Instance);
    }
}
