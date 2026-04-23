using System.Text.Json;

using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Decisioning.Models;

namespace ArchLucid.ArtifactSynthesis.Generators;

public class CoverageSummaryArtifactGenerator : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.CoverageSummary;

    public Task<SynthesizedArtifact> GenerateAsync(
        GoldenManifest manifest,
        CancellationToken ct)
    {
        _ = ct;
        CoverageSummaryArtifactModel model = new()
        {
            CoveredRequirementCount = manifest.Requirements.Covered.Count,
            UncoveredRequirementCount = manifest.Requirements.Uncovered.Count,
            SecurityGapCount = manifest.Security.Gaps.Count,
            ComplianceGapCount = manifest.Compliance.Gaps.Count,
            UnresolvedIssueCount = manifest.UnresolvedIssues.Items.Count,
            TopologyGaps = manifest.Topology.Gaps.ToList()
        };

        string content = JsonSerializer.Serialize(model, SynthesisJsonOptions.WriteIndented);

        return Task.FromResult(new SynthesizedArtifact
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = DateTime.UtcNow,
            ArtifactType = Models.ArtifactType.CoverageSummary,
            Name = "coverage-summary.json",
            Format = "json",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content)
        });
    }
}
