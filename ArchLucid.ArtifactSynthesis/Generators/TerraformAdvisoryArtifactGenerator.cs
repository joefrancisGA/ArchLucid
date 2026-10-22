using ArchLucid.ArtifactSynthesis.Interfaces;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.ArtifactSynthesis.Services;
using ArchLucid.ArtifactSynthesis.Validation;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Terraform;

namespace ArchLucid.ArtifactSynthesis.Generators;

/// <summary>Emits advisory <c>.tf</c> comments for decommission-style decisions; never emits resource or removal blocks.</summary>
public sealed class TerraformAdvisoryArtifactGenerator : IArtifactGenerator
{
    private readonly ITerraformValidator _terraformValidator;

    public TerraformAdvisoryArtifactGenerator(ITerraformValidator terraformValidator)
    {
        ArgumentNullException.ThrowIfNull(terraformValidator);
        _terraformValidator = terraformValidator;
    }

    public string ArtifactType => Models.ArtifactType.TerraformAdvisory;

    /// <summary>
    ///     Builds comment-only advisory <c>.tf</c> for decommission-style manifest decisions. Never emits
    ///     <c>resource</c> or removal blocks — only validated HCL comments plus optional validation-warning stubs.
    /// </summary>
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

        content = TerraformAdvisoryHclSanitizer.ValidateAndSanitize(content, _terraformValidator);

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
