using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Costing;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

public sealed class CostSummaryArtifactGenerator(IInfrastructureCostArtifactAugmentationProvider augmentationProvider) : IArtifactGenerator
{
    private readonly IInfrastructureCostArtifactAugmentationProvider _augmentationProvider =
        augmentationProvider ?? throw new ArgumentNullException(nameof(augmentationProvider));

    public string ArtifactType => Models.ArtifactType.CostSummary;

    public async Task<SynthesizedArtifact> GenerateAsync(
        ManifestDocument manifest,
        CancellationToken ct)
    {
        List<InfrastructureCostQueryNode> nodes =
            ManifestInfrastructureCostNodes.FromGoldenTopology(manifest.Topology.Services, manifest.Topology.Datastores);

        InfrastructureCostArtifactAugmentation infra =
            await _augmentationProvider.AugmentNodesAsync(nodes,

                ct).ConfigureAwait(false);

        CostSummaryArtifactModel model =
            new()
            {
                MaxMonthlyCost =
                    manifest.Cost.MaxMonthlyCost,
                Risks =
                    manifest.Cost.CostRisks.ToList(),
                Notes =
                    manifest.Cost.Notes.ToList(),
                TopologyInferredInfrastructureUsdPerMonth =
                    infra.InferredUsdPerMonth,
                InfrastructureSummaryNote =
                    infra.SummaryNote,
                InfrastructureLines = infra.Lines.Select(MapInfrastructureLine).ToList(),
            };

        string content = JsonSerializer.Serialize(model, SynthesisJsonOptions.WriteIndented);

        return new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId =
                manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = Models.ArtifactType.CostSummary,
            Name = "cost-summary.json",
            Format = "json",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content),
        };
    }

    private static CostSummaryInfrastructureLineModel MapInfrastructureLine(InfrastructureCostLine line)
        =>
            new()

            {
                LineKind = line.LineKind,
                DisplayName = line.DisplayName,
                RuntimePlatform = line.Platform.ToString(),
                AzureProductLabel = line.AzureProductLabel,
                EstimatedUsdPerMonth = line.EstimatedUsdPerMonth,
                PriceSource = line.PriceSource.ToString(),
            };
}
