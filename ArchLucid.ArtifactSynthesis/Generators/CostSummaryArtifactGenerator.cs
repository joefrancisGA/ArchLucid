using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

public class CostSummaryArtifactGenerator : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.CostSummary;

    public Task<SynthesizedArtifact> GenerateAsync(
        GoldenManifest manifest,
        CancellationToken ct)
    {
        _ = ct;
        CostSummaryArtifactModel model = new()
        {
            MaxMonthlyCost = manifest.Cost.MaxMonthlyCost,
            Risks = manifest.Cost.CostRisks.ToList(),
            Notes = manifest.Cost.Notes.ToList()
        };

        string content = JsonSerializer.Serialize(model, SynthesisJsonOptions.WriteIndented);

        return Task.FromResult(new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = DateTime.UtcNow,
            ArtifactType = Models.ArtifactType.CostSummary,
            Name = "cost-summary.json",
            Format = "json",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content)
        });
    }
}
