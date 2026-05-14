using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.Core.Manifest;

namespace ArchLucid.ArtifactSynthesis.Generators;

/// <summary>Emits advisory <c>.tf</c> comments for decommission-style decisions; never emits resource or removal blocks.</summary>
public sealed class TerraformAdvisoryArtifactGenerator : IArtifactGenerator
{
    public string ArtifactType => Models.ArtifactType.TerraformAdvisory;

    public Task<SynthesizedArtifact> GenerateAsync(ManifestDocument manifest, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(manifest);
        _ = ct;

        List<ResolvedArchitectureDecision> decommission = manifest.Decisions
            .Where(TerraformAdvisoryDecommissionIntentDetector.LooksLikeDecommissionRequest)
            .ToList();

        string content = decommission.Count > 0
            ? string.Join(
                $"{Environment.NewLine}{Environment.NewLine}",
                decommission.Select(TerraformAdvisoryDecommissionSnippetBuilder.BuildDecisionSection))
            : TerraformAdvisoryDecommissionSnippetBuilder.BuildNoDecommissionManifestStub();

        SynthesizedArtifact artifact = new()
        {
            ArtifactId = Guid.NewGuid(),
            RunId = manifest.RunId,
            ManifestId = manifest.ManifestId,
            CreatedUtc = TimeProvider.System.UtcNowDateTime(),
            ArtifactType = Models.ArtifactType.TerraformAdvisory,
            Name = "advisory-terraform.tf",
            Format = "text/terraform",
            Content = content,
            ContentHash = ArtifactHashing.ComputeHash(content),
            Metadata = new Dictionary<string, string> { ["kind"] = "advisory-terraform" },
        };

        return Task.FromResult(artifact);
    }
}
